import type { Workout } from "@prisma/client";
import { useEffect, useState } from "react";
import type { ActionFunction, LoaderFunction, MetaFunction } from "remix";
import {
  redirect,
  useActionData,
  useCatch,
  useLoaderData,
  useParams,
} from "remix";
import { RoutineDisplay } from "~/components/routine/routine";
import type { RoutineWithWorkouts } from "~/types/db-includes";
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
  workouts: Workout[];
  routine: RoutineWithWorkouts;
  isOwner: boolean;
};
type ActionData = { status?: number; form?: string };

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = (await getUserId(request)) as string;

  const workouts = await db.workout.findMany({
    where: {
      workoutUser: userId,
    },
  });
  const routine = await db.routine.findUnique({
    where: { id: params.routineId },
    include: {
      workouts: true,
    },
  });
  if (!routine) {
    throw new Response("What a routine! Not found.", {
      status: 404,
    });
  }
  const data: LoaderData = {
    routine,
    workouts,
    isOwner: userId === routine.routineUser,
  };
  return data;
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();

  if (form.get("_method") === "delete") {
    const userId = await requireUserId(request);
    const routine = await db.routine.findUnique({
      where: { id: params.routineId },
    });
    if (!routine) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }
    if (routine.routineUser !== userId) {
      throw new Response("Pssh, nice try. That's not your routine", {
        status: 401,
      });
    }
    await db.routine.delete({ where: { id: params.routineId } });
    return redirect(`/routines`);
  }

  if (form.get("_method") === "patch") {
    const userId = await requireUserId(request);

    const name = form.get("name") as string;
    const workoutIds = form.getAll("workouts");
    const removedWorkoutIds = form.getAll("_removedWorkoutIds").filter(
      (id) => !workoutIds.includes(id)
    );


    const routine = await db.routine.findUnique({
      where: { id: params.routineId },
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

    await db.routine.update({
      where: { id: params.routineId },
      data: {
        name,
        workouts: {
          connect: workoutIds.map((id) => {
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
  const actionData = useActionData<ActionData>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (actionData?.status === 200 && actionData?.form === "patch") {
      setShowEditModal(false);
    }
  }, [actionData]);

  return (
    <RoutineDisplay
      workouts={data.workouts}
      showEditModal={showEditModal}
      showDeleteModal={showDeleteModal}
      setShowEditModal={setShowEditModal}
      setShowDeleteModal={setShowDeleteModal}
      routine={data.routine}
      isOwner={data.isOwner}
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
