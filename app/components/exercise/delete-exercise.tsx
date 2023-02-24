import type { Exercise } from "@prisma/client";
import { Form } from "remix";

export function DeleteExercise({
  exercise,
  isOwner,
  canDelete = true,
  display = false,
}: {
  exercise: Pick<Exercise, "name">;
  isOwner: boolean;
  canDelete?: boolean;
  display?: boolean;
}) {
  return (
    <div className={`modal-backdrop ${!display ? "hidden" : ""}`}>
      <div className={`modal ${!display ? "hidden" : ""}`}>
        <h2>Delete {exercise.name}?</h2>
        {isOwner ? (
          <Form method="post">
            <input type="hidden" name="_method" value="delete" />
            <button type="submit" className="button" disabled={!canDelete}>
              Delete
            </button>
          </Form>
        ) : null}
      </div>
    </div>
  );
}
