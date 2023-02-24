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
import { WorkoutDisplay } from "~/components/workout/workout";
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

type LoaderData = { workout: Workout; isOwner: boolean };
type ActionData = { status?: number; form?: string };

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);

  const workout = await db.workout.findUnique({
    where: { id: params.workoutId },
  });
  if (!workout) {
    throw new Response("What a workout! Not found.", {
      status: 404,
    });
  }
  const data: LoaderData = {
    workout,
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
  } else if (form.get("_method") === "patch") {
    const name = form.get("name") as string;
    const userId = await requireUserId(request);
    const workout = await db.workout.findUnique({
      where: { id: params.workoutId },
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

    await db.workout.update({
      where: { id: params.workoutId },
      data: { name },
    });
    return { form: "patch", status: 200 };
  }
};

export default function WorkoutRoute() {
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  console.log("actionData");
  console.log(actionData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (actionData?.status === 200 && actionData?.form === "patch") {
      setShowEditModal(false);
    }
  }, [actionData]);

  return (
    <WorkoutDisplay
      showEditModal={showEditModal}
      showDeleteModal={showDeleteModal}
      setShowEditModal={setShowEditModal}
      setShowDeleteModal={setShowDeleteModal}
      workout={data.workout}
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
