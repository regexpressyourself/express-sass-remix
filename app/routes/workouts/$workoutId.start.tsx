import type { WorkoutSet } from "@prisma/client";
import {
  type ActionFunction,
  type LinksFunction,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useCatch,
  useLoaderData,
  useParams,
  useRevalidator,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { DeleteWorkoutSet } from "~/components/workout/delete-set";
import { WorkoutSetItem } from "~/components/workout/workout-set-item";
import startWorkoutStylesUrl from "~/styles/start-workout.css";
import type { WorkoutWithExercisesWithSets } from "~/types/db-includes";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: startWorkoutStylesUrl,
    },
  ];
};

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
type ExerciseHash = { [exerciseId: string]: WorkoutSet[] };

type LoaderData = {
  workout: WorkoutWithExercisesWithSets;

  prevExerciseHash: ExerciseHash;
  isOwner: boolean;
};
type ActionData = {
  type?: string;
  status?: number;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = (await getUserId(request)) as string;

  let workout = await db.workout.findUnique({
    where: { id: params.workoutId },
    include: {
      exercises: {
        include: {
          sets: {
            where: {
              setWorkout: params.workoutId,
            },
            orderBy: { setNum: "asc" },
          },
        },
      },
    },
  });
  if (!workout) {
    throw new Response("What a workout! Not found.", {
      status: 404,
    });
  }

  const prevExerciseHash: ExerciseHash = {};

  const mostRecentSetPromises = workout?.exercises?.map((exercise) => {
    return db.workoutSet.findMany({
      where: { setExercise: exercise.id },
      take: 1,
      orderBy: {
        createdAt: "asc",
      },
    });
  });
  const mostRecentSets = await Promise.all(mostRecentSetPromises || []);

  const previousWorkoutIds = mostRecentSets
    .map(
      (mostRecentSet) =>
        mostRecentSet &&
        mostRecentSet[0] && {
          setWorkout: mostRecentSet[0].setWorkout,
          setExercise: mostRecentSet[0].setExercise,
        }
    )
    .filter((mostRecentSet) => mostRecentSet);

  const previousWorkoutSetPromises = previousWorkoutIds.map(
    (previousWorkoutId) =>
      db.workoutSet.findMany({
        where: {
          ...previousWorkoutId,
        },
      })
  );
  const previousWorkoutSets = await Promise.all(previousWorkoutSetPromises);
  previousWorkoutSets.forEach((previousWorkoutSet) => {
    const firstSet = previousWorkoutSet[0];
    if (firstSet) {
      prevExerciseHash[firstSet.setExercise] = previousWorkoutSet;
    }
  });

  const newSetPromises: Promise<any>[] = [];
  let workoutIsUpdated = false;
  workout.exercises.map((exercise) => {
    const exerciseSetLength = exercise?.sets?.length || 0;
    const prevExerciseSetLength = prevExerciseHash[exercise.id]
      ? prevExerciseHash[exercise.id].length
      : 0;
    if (exerciseSetLength < prevExerciseSetLength) {
      workoutIsUpdated = true;
      prevExerciseHash[exercise.id].map((workoutSet) => {
        newSetPromises.push(
          db.workoutSet.create({
            data: {
              setWorkout: workout.id,
              setExercise: exercise.id,
              setUser: userId,
              setNum: workoutSet.setNum,
            },
          })
        );
      });
    }
  });
  const results = await Promise.all(newSetPromises);

  if (workoutIsUpdated) {
    workout = await db.workout.findUnique({
      where: { id: params.workoutId },
      include: {
        exercises: {
          include: {
            sets: {
              where: {
                setWorkout: params.workoutId,
              },
              orderBy: { setNum: "asc" },
            },
          },
        },
      },
    });
  }

  const data: LoaderData = {
    workout,
    prevExerciseHash,
    isOwner: userId === workout.workoutUser,
  };
  return data;
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();

  if (form.get("_method") === "post-set") {
    const userId = await requireUserId(request);
    const exerciseId = form.get("_exercise-id") as string;
    const workoutId = params.workoutId;
    const setNum = parseInt((form.get("_exercise-set-num") || 0) as string);
    if (!userId || !exerciseId || !workoutId) {
      throw new Response("Can't find data", { status: 404 });
    }

    const workoutSet = await db.workoutSet.create({
      data: {
        setWorkout: workoutId,
        setExercise: exerciseId,
        setUser: userId,
        setNum,
      },
    });

    return {};
  }

  if (form.get("_method") === "update-set") {
    const userId = await requireUserId(request);
    const workoutSetId = form.get("_set-id");

    const rawWeight = form.get("_weight");
    const rawReps = form.get("_reps") as string;
    const weight = Number(rawWeight || -1);
    const reps = Number(rawReps || -1);

    if (!userId || !workoutSetId) {
      throw new Response("Can't find data", { status: 404 });
    }
    //if (
    //(weight as string) !== (rawWeight as string) ||
    //(reps as string) !== (rawReps as string)
    //) {
    //throw new Response("Must be a number", { status: 400 });
    //}

    const updatePayload: { weight: number | null; reps: number | null } = {
      weight: null,
      reps: null,
    };
    if (weight > 0) {
      updatePayload.weight = weight;
    }
    if (reps > 0) {
      updatePayload.reps = reps;
    }
    const updatedWorkoutSet = await db.workoutSet.update({
      where: {
        id: workoutSetId,
      },
      data: {
        ...updatePayload,
      },
    });
    return {};
  }

  if (form.get("_method") === "delete-set") {
    const userId = await requireUserId(request);
    const workoutSetId = form.get("_set-id") as string;
    const workoutId = form.get("_workout-id") as string;
    const exerciseId = form.get("_exercise-id") as string;
    const setNum = (form.get("_set-num") || 0) as number;
    if (!userId || !workoutSetId) {
      throw new Response("Can't find data", { status: 404 });
    }
    const workoutSet = await db.workoutSet.delete({
      where: {
        id: workoutSetId,
      },
    });

    const workoutSets = await db.workoutSet.findMany({
      where: {
        setWorkout: workoutId,
        setExercise: exerciseId,
      },
    });
    const workoutSetUpdatePromises = workoutSets.map((workoutSet) => {
      return db.workoutSet.update({
        where: { id: workoutSet.id },
        data: {
          setNum:
            workoutSet.setNum > setNum
              ? workoutSet.setNum - 1
              : workoutSet.setNum,
        },
      });
    });
    await Promise.all(workoutSetUpdatePromises);
    return { type: "delete-set", status: 200 };
  }

  if (form.get("_method") === "complete-set") {
    const userId = await requireUserId(request);
    const workoutSetId = form.get("_set-id") as string;
    if (!userId || !workoutSetId) {
      throw new Response("Can't find data", { status: 404 });
    }
    await db.workoutSet.update({
      where: { id: workoutSetId },
      data: {
        isComplete: true,
      },
    });
    return { type: "complete-set", status: 200 };
  }
  if (form.get("_method") === "uncomplete-set") {
    const userId = await requireUserId(request);
    const workoutSetId = form.get("_set-id") as string;
    if (!userId || !workoutSetId) {
      throw new Response("Can't find data", { status: 404 });
    }
    await db.workoutSet.update({
      where: { id: workoutSetId },
      data: {
        isComplete: false,
      },
    });
    return { type: "uncomplete-set", status: 200 };
  }
};

export default function WorkoutRoute() {
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const revalidator = useRevalidator();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workoutSetToDelete, setWorkoutSetToDelete] =
    useState<WorkoutSet | null>(null);
  // run when you need to update

  useEffect(() => {
    if (actionData?.status === 200 && actionData?.type === "delete-set") {
      setShowDeleteModal(false);
      revalidator.revalidate();
    }
  }, [actionData]);

  return (
    <main className="routines-main">
      <div className="container">
        <h1>"{data.workout.name}" workout</h1>
        {data?.workout?.exercises?.map((exercise) => {
          return (
            <div className="exercise-item" key={exercise.id}>
              <h2>{exercise.name}</h2>
              {exercise.sets.map((workoutSet, i) => {
                return (
                  <WorkoutSetItem
                    previousSet={
                      data.prevExerciseHash[exercise.id].filter(
                        (previousSet) =>
                          previousSet.setNum === workoutSet.setNum
                      )[0]
                    }
                    workoutSet={workoutSet}
                    setShowDeleteModal={setShowDeleteModal}
                    setWorkoutSetToDelete={setWorkoutSetToDelete}
                    key={workoutSet.id}
                  />
                );
              })}
              <Form method="post">
                <input type="hidden" name="_method" value="post-set" />
                <input type="hidden" name="_exercise-id" value={exercise.id} />
                <input
                  type="hidden"
                  name="_exercise-set-num"
                  value={exercise?.sets?.length}
                />
                <button className="button">Add set</button>
              </Form>
            </div>
          );
        })}
      </div>

      {showDeleteModal && workoutSetToDelete ? (
        <DeleteWorkoutSet
          workoutSet={workoutSetToDelete}
          isOwner={data.isOwner}
          display={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
        />
      ) : null}
    </main>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  switch (caught.status) {
    case 400: {
      return (
        <>
          <div className="error-container">
            Weight and reps must be a number
          </div>
          <Link to={`/workouts/${params.workoutId}/start`}>
            <button className="button">Back to workout</button>
          </Link>
        </>
      );
    }
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
