import type { Routine } from "@prisma/client";
import { Form } from "remix";

export function DeleteRoutine({
  routine,
  isOwner,
  canDelete = true,
  display = false,
  setShowDeleteModal,
}: {
  routine: Pick<Routine, "name">;
  isOwner: boolean;
  canDelete?: boolean;
  display?: boolean;
  setShowDeleteModal?: (value: boolean) => void;
}) {
  return (
    <div className={`modal-backdrop ${!display ? "hidden" : ""}`}>
      <div className={`modal ${!display ? "hidden" : ""}`}>
        <h2>Delete {routine.name}?</h2>
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
