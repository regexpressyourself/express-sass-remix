import type { Exercise } from "@prisma/client";
import {
  redirect,
  type ActionFunction,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useCatch,
  useLoaderData,
  useParams,
  useRevalidator,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { RoutineDisplay } from "~/components/routine/routine";
import type { RoutineWithExercises } from "~/types/db-includes";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No routine",
      description: "No routine found",
    };
  }
  return {
    title: `"${data.routine.name}" routine`,
    description: `Enjoy the "${data.routine.name}" routine and much more`,
  };
};

type LoaderData = {
  exercises: Exercise[];
  routine: RoutineWithExercises;
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
  const routine = await db.routine.findUnique({
    where: { id: params.routineId },
    include: {
      exercises: true,
    },
  });
  if (!routine) {
    throw new Response("What a routine! Not found.", {
      status: 404,
    });
  }
  const data: LoaderData = {
    routine,
    exercises,
    isOwner: userId === routine.routineUser,
  };
  return data;
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();

  if (form.get("_method") === "delete-routine") {
    const userId = await requireUserId(request);
    const id = form.get("_id") as string;
    const routine = await db.routine.findUnique({
      where: { id },
    });
    if (!routine) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }
    if (routine.routineUser !== userId) {
      throw new Response("Pssh, nice try. That's not your routine", {
        status: 401,
      });
    }
    await db.routine.delete({ where: { id } });
    return redirect(`/routines`);
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

    await db.routine.update({
      where: { id: params.routineId },
      data: {
        exercises: {
          disconnect: [{ id }],
        },
      },
    });

    return { type: "delete-exercise", status: 200 };
  }
  if (form.get("_method") === "post-workout") {
    const userId = await requireUserId(request);

    const routine = await db.routine.findUnique({
      where: { id: params.routineId },

      include: {
        exercises: true,
      },
    });

    if (!userId) {
      throw new Response("Can't find user", { status: 404 });
    }
    if (!routine) {
      throw new Response("Can't find routine", { status: 404 });
    }

    const workout = await db.workout.create({
      data: {
        name: `${new Date().toISOString().split("T")[0]} Workout` as string,
        exerciseOrder: routine.exerciseOrder || {},
        workoutUser: userId,
        workoutRoutine: routine.id,
        //exercises: {
        //connect:
        //routine.exercises.map((exercise) => ({ id: exercise.id })) || [],
        //},
      },
      include: {
        exercises: true,
      },
    });
    const updatedWorkout = await db.workout.update({
      where: { id: workout.id },
      data: {
        exercises: {
          connect:
            routine.exercises.map((exercise) => ({ id: exercise.id })) || [],
        },
      },
      include: {
        exercises: true,
      },
    });
    return redirect(`/workouts/${updatedWorkout.id}`);
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

    const routine = await db.routine.findUnique({
      where: { id: params.routineId },

      include: {
        exercises: true,
      },
    });
    if (!routine) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }
    if (!name) {
      throw new Response("Needs name", { status: 500 });
    }
    if (routine.routineUser !== userId) {
      throw new Response("Pssh, nice try. That's not your routine", {
        status: 401,
      });
    }
    const currentExerciseIds =
      routine.exercises?.map((exercise) => exercise.id) || [];

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
      where: { id: params.routineId },
      data: {
        name,
        exerciseOrder: JSON.parse(exerciseOrder),
        ...connectParams,
      },
    };
    await db.routine.update(payload);
    return { form: "patch", status: 200 };
  }
};

export default function RoutineRoute() {
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
      <RoutineDisplay
        routine={data.routine}
        isOwner={data.isOwner}
        exercises={data.exercises}
        showAddExerciseModal={showAddExerciseModal}
        setShowAddExerciseModal={setShowAddExerciseModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        setShowDeleteExerciseModal={setShowDeleteExerciseModal}
        showDeleteExerciseModal={showDeleteExerciseModal}
      />
      <Form method="post">
        <input type="hidden" name="_method" value="post-workout" />
        <button className="button" type="submit">
          Start workout
        </button>
      </Form>
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
          Huh? What the heck is {params.routineId}?
        </div>
      );
    }
    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.routineId} is not your routine.
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

  const { routineId } = useParams();
  return (
    <div className="error-container">{`There was an error loading routine by the id ${routineId}. Sorry.`}</div>
  );
}
