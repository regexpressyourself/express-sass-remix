import type { Workout, Exercise } from "@prisma/client";
import { useState } from "react";
import type { ActionFunction, LoaderFunction, MetaFunction } from "remix";
import { redirect, useCatch, useLoaderData, useParams } from "remix";
import { WorkoutDisplay } from "~/components/workout/workout";
import type { RoutineWithWorkouts , WorkoutWithExercises} from "~/types/db-includes";
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
  workout: WorkoutWithExercises;
  exercises: Exercise[];
  isOwner: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = (await getUserId(request)) as string;

  const exercises = await db.exercise.findMany({
    where: {
      exerciseUser: userId,
    },
  });
  const workout = await db.workout.findUnique({
    where: { id: params.workoutId},
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

  if (form.get("_method") === "delete") {
    const userId = await requireUserId(request);
    const workout = await db.workout.findUnique({
      where: { id: params.workoutId },
    });
    if (!workout) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }
    if (workout.workoutUser !== userId) {
      throw new Response("Pssh, nice try. That's not your workout", {
        status: 401,
      });
    }
    await db.workout.delete({ where: { id: params.workoutId } });
    return redirect(`/workouts`);
  }

  if (form.get("_method") === "patch") {
    const userId = await requireUserId(request);

    const name = form.get("name") as string;
    const exerciseOrder = form.get("_exerciseOrder") as string;
    const exerciseIds = (form.get("_exercises") as string)?.split(",") || [];
    const removedWorkoutIds =
      (form?.get("_removedWorkoutIds") as string)
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
    const currentWorkoutIds = workout.exercises.map((exercise) => exercise.id);

    const newWorkoutIds = exerciseIds.filter((exerciseId) => {
      return !currentWorkoutIds.includes(exerciseId as string);
    });

    await db.workout.update({
      where: { id: params.workoutId },
      data: {
        name,
        exerciseOrder: JSON.parse(exerciseOrder),
        exercises: {
          connect: newWorkoutIds.map((id) => {
            return { id: id as string };
          }),
          disconnect: removedWorkoutIds.map((id) => {
            return { id: id as string };
          }),
        },
      },
    });
    return { form: "patch", status: 200 };
  }
};

export default function RoutineRoute() {
  const data = useLoaderData<LoaderData>();
  console.log("data")
  console.log(data)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

  return (
    <WorkoutDisplay
      workout={data.workout}
      isOwner={data.isOwner}
      exercises={data.exercises}
      showAddExerciseModal={showAddExerciseModal}
      setShowAddExerciseModal={setShowAddExerciseModal}
      showDeleteModal={showDeleteModal}
      setShowDeleteModal={setShowDeleteModal}
    />
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
