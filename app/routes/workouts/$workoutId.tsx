import type { Exercise } from "@prisma/client";
import {
  redirect,
  type ActionFunction,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import {
  Link,
  useActionData,
  useCatch,
  useLoaderData,
  useParams,
  useRevalidator,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { WorkoutDisplay } from "~/components/workout/workout";
import type { WorkoutWithExercises } from "~/types/db-includes";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No workout",
      description: "No workout found",
    };
  }
  return {
    title: `"${data.workout.name}" workout`,
    description: `Enjoy the "${data.workout.name}" workout and much more`,
  };
};

type LoaderData = {
  exercises: Exercise[];
  workout: WorkoutWithExercises;
  isOwner: boolean;
};
type ActionData = {
  type?: string;
  status?: number;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = (await getUserId(request)) as string;

  const exercises = await db.exercise.findMany({
    where: {
      exerciseUser: userId,
    },
  });
  const workout = await db.workout.findUnique({
    where: { id: params.workoutId },
    include: {
      exercises: true,
    },
  });
  if (!workout) {
    throw new Response("What a workout! Not found.", {
      status: 404,
    });
  }
  const data: LoaderData = {
    workout,
    exercises,
    isOwner: userId === workout.workoutUser,
  };
  return data;
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();

  if (form.get("_method") === "delete-workout") {
    const userId = await requireUserId(request);
    const id = form.get("_id") as string;
    const workout = await db.workout.findUnique({
      where: { id },
    });
    if (!workout) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }
    if (workout.workoutUser !== userId) {
      throw new Response("Pssh, nice try. That's not your workout", {
        status: 401,
      });
    }
    await db.workout.delete({ where: { id } });
    return redirect(`/workouts`);
  }
  if (form.get("_method") === "delete-exercise") {
    const userId = await requireUserId(request);
    const id = form.get("_id") as string;
    const exercise = await db.exercise.findUnique({
      where: { id },
    });
    if (!exercise) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }
    if (exercise.exerciseUser !== userId) {
      throw new Response("Pssh, nice try. That's not your exercise", {
        status: 401,
      });
    }

    await db.workout.update({
      where: { id: params.workoutId },
      data: {
        exercises: {
          disconnect: [{ id }],
        },
      },
    });

    return { type: "delete-exercise", status: 200 };
  }

  if (form.get("_method") === "patch") {
    const userId = await requireUserId(request);

    const name = form.get("name") as string;
    const exerciseOrder = form.get("_exerciseOrder") as string;
    const exerciseIds = (form.get("_exercises") as string)?.split(",") || [];
    const removedExerciseIds =
      (form?.get("_removedExerciseIds") as string)
        ?.split(",")
        ?.filter((id) => !exerciseIds.includes(id)) || [];

    const workout = await db.workout.findUnique({
      where: { id: params.workoutId },

      include: {
        exercises: true,
      },
    });
    if (!workout) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }
    if (!name) {
      throw new Response("Needs name", { status: 500 });
    }
    if (workout.workoutUser !== userId) {
      throw new Response("Pssh, nice try. That's not your workout", {
        status: 401,
      });
    }
    const currentExerciseIds = workout.exercises.map((exercise) => exercise.id);

    const newExerciseIds = exerciseIds.filter((exerciseId) => {
      return !currentExerciseIds.includes(exerciseId as string);
    });
    const connectParams: any = {};
    if (newExerciseIds.length > 0) {
      connectParams.exercises = {
        connect: newExerciseIds
          .filter((id) => id)
          .map((id) => {
            return { id: id as string };
          }),
        disconnect: removedExerciseIds.map((id) => {
          return { id: id as string };
        }),
      };
    }
    const payload = {
      where: { id: params.workoutId },
      data: {
        name,
        exerciseOrder: JSON.parse(exerciseOrder),
        ...connectParams,
      },
    };
    await db.workout.update(payload);
    return { form: "patch", status: 200 };
  }
};

export default function WorkoutRoute() {
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteExerciseModal, setShowDeleteExerciseModal] =
    useState<boolean>(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const revalidator = useRevalidator();

  // run when you need to update

  useEffect(() => {
    if (actionData?.status === 200 && actionData?.type === "delete-exercise") {
      setShowDeleteExerciseModal(false);
      revalidator.revalidate();
    }
  }, [actionData]);

  return (
    <div className="container form-container">
      <WorkoutDisplay
        workout={data.workout}
        isOwner={data.isOwner}
        exercises={data.exercises}
        showAddExerciseModal={showAddExerciseModal}
        setShowAddExerciseModal={setShowAddExerciseModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        setShowDeleteExerciseModal={setShowDeleteExerciseModal}
        showDeleteExerciseModal={showDeleteExerciseModal}
      />
      <Link to={`/workouts/${data.workout.id}/start`}>
        <button className="button w-100">Start workout</button>
      </Link>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  switch (caught.status) {
    case 404: {
      return (
        <div className="error-container">
          Huh? What the heck is {params.workoutId}?
        </div>
      );
    }
    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.workoutId} is not your workout.
        </div>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  const { workoutId } = useParams();
  return (
    <div className="error-container">{`There was an error loading workout by the id ${workoutId}. Sorry.`}</div>
  );
}
