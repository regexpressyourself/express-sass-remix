import {
  json,
  redirect,
  type ActionFunction,
  type LoaderFunction,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useCatch,
  useTransition,
} from "@remix-run/react";
import { ExerciseDisplay } from "~/components/exercise/exercise";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return {};
};

function validateExerciseName(name: string) {
  if (name.length < 2) {
    return `That exercise's name is too short`;
  }
}

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name: string | undefined;
  };
  fields?: {
    name: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const searchParams = new URL(request.url).searchParams;
  const redirectTo = searchParams.get("redirectTo");
  const userId = await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name");
  if (typeof name !== "string") {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  const fieldErrors = {
    name: validateExerciseName(name),
  };
  const fields = { name };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  const exercise = await db.exercise.create({
    data: { ...fields, exerciseUser: userId },
  });
  return redirectTo
    ? redirect(redirectTo)
    : redirect(`/exercises/${exercise.id}`);
};

export default function NewExerciseRoute() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();

  if (transition.submission) {
    const name = transition.submission.formData.get("name");
    if (typeof name === "string" && !validateExerciseName(name)) {
      return (
        <ExerciseDisplay
          exercise={{ name }}
          isOwner={true}
          canDelete={false}
          setShowDeleteModal={() => null}
        />
      );
    }
  }

  return (
    <div>
      <p>Add your exercise</p>
      <Form method="post">
        <div>
          <label>
            Name:{" "}
            <input
              type="text"
              defaultValue={actionData?.fields?.name}
              name="name"
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-describedby={
                actionData?.fieldErrors?.name ? "name-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a exercise.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
}
