import type { ActionFunction, LoaderFunction } from "remix";
import {
  Form,
  json,
  Link,
  redirect,
  useActionData,
  useCatch,
  useTransition,
} from "remix";
import { WorkoutDisplay } from "~/components/workout/workout";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return {};
};

function validateWorkoutName(name: string) {
  if (name.length < 2) {
    return `That workout's name is too short`;
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
  const userId = await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name");
  if (typeof name !== "string") {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  const fieldErrors = {
    name: validateWorkoutName(name),
  };
  const fields = { name };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  const workout = await db.workout.create({
    data: { ...fields, workoutUser: userId },
  });
  return redirect(`/workouts/${workout.id}`);
};

export default function NewWorkoutRoute() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();

  if (transition.submission) {
    const name = transition.submission.formData.get("name");
    if (typeof name === "string" && !validateWorkoutName(name)) {
      return (
        <WorkoutDisplay workout={{ name }} isOwner={true} canDelete={false} />
      );
    }
  }

  return (
    <div>
      <p>Add your workout</p>
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
  )
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a workout.</p>
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
