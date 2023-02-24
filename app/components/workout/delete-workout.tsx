import type { Workout } from "@prisma/client";
import { Form } from "remix";

export function DeleteWorkout({
  workout,
  isOwner,
  canDelete = true,
  display = false,
}: {
  workout: Pick<Workout, "name">;
  isOwner: boolean;
  canDelete?: boolean;
  display?: boolean;
}) {
  return (
    <div className={`modal-backdrop ${!display ? "hidden" : ""}`}>
      <div className={`modal ${!display ? "hidden" : ""}`}>
        <h2>Delete {workout.name}?</h2>
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
