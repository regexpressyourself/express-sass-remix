import type { Exercise } from "@prisma/client";
import { useEffect, useState } from "react";
import type { ActionFunction, LoaderFunction, MetaFunction } from "remix";
import {
  redirect,
  useActionData,
  useCatch,
  useLoaderData,
  useParams,
} from "remix";
import { ExerciseDisplay } from "~/components/exercise/exercise";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No exercise",
      description: "No exercise found",
    };
  }
  return {
    title: `"${data.exercise.name}" exercise`,
    description: `Enjoy the "${data.exercise.name}" exercise and much more`,
  };
};

type LoaderData = { exercise: Exercise; isOwner: boolean };
type ActionData = { status?: number; form?: string };

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);

  const exercise = await db.exercise.findUnique({
    where: { id: params.exerciseId },
  });
  if (!exercise) {
    throw new Response("What a exercise! Not found.", {
      status: 404,
    });
  }
  const data: LoaderData = {
    exercise,
    isOwner: userId === exercise.exerciseUser,
  };
  return data;
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();
  if (form.get("_method") === "delete") {
    const userId = await requireUserId(request);
    const exercise = await db.exercise.findUnique({
      where: { id: params.exerciseId },
    });
    if (!exercise) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }
    if (exercise.exerciseUser !== userId) {
      throw new Response("Pssh, nice try. That's not your exercise", {
        status: 401,
      });
    }
    await db.exercise.delete({ where: { id: params.exerciseId } });
    return redirect(`/exercises`);
  } else if (form.get("_method") === "patch") {
    const name = form.get("name") as string;
    const userId = await requireUserId(request);
    const exercise = await db.exercise.findUnique({
      where: { id: params.exerciseId },
    });
    if (!exercise) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }
    if (!name) {
      throw new Response("Needs name", { status: 500 });
    }
    if (exercise.exerciseUser !== userId) {
      throw new Response("Pssh, nice try. That's not your exercise", {
        status: 401,
      });
    }

    await db.exercise.update({
      where: { id: params.exerciseId },
      data: { name },
    });
    return { form: "patch", status: 200 };
  }
};

export default function ExerciseRoute() {
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
    <ExerciseDisplay
      showEditModal={showEditModal}
      showDeleteModal={showDeleteModal}
      setShowEditModal={setShowEditModal}
      setShowDeleteModal={setShowDeleteModal}
      exercise={data.exercise}
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
          Huh? What the heck is {params.exerciseId}?
        </div>
      );
    }
    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.exerciseId} is not your exercise.
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

  const { exerciseId } = useParams();
  return (
    <div className="error-container">{`There was an error loading exercise by the id ${exerciseId}. Sorry.`}</div>
  );
}
