import type { Workout } from "@prisma/client";
import { useEffect, useRef } from "react";
import { X } from "react-feather";
import { Form } from "@remix-run/react";

export function DeleteWorkout({
  workout,
  isOwner,
  canDelete = true,
  display = false,
  setShowDeleteModal,
}: {
  workout: Workout;
  isOwner: boolean;
  canDelete?: boolean;
  display?: boolean;
  setShowDeleteModal: (value: boolean) => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    backdropRef?.current?.addEventListener("click", (e) => {
      if (
        e?.target instanceof HTMLElement &&
        e?.target?.className?.includes("modal-backdrop")
      ) {
        setShowDeleteModal(false);
      }
    });
  }, []);

  return (
    <div
      className={`modal-backdrop ${!display ? "hidden" : ""}`}
      ref={backdropRef}
    >
      <div className={`modal confirmation-modal ${!display ? "hidden" : ""}`}>
        <button
          className="modal-x"
          onClick={() => {
            setShowDeleteModal(false);
          }}
        >
          <X />
        </button>
        <h2>Delete {workout.name}?</h2>
        <div className="content">
          {isOwner ? (
            <Form method="post">
              <input type="hidden" name="_method" value="delete-workout" />
              <input type="hidden" name="_id" value={workout.id} />
              <button
                type="submit"
                className="button modal-action danger"
                disabled={!canDelete}
              >
                Delete Workout
              </button>
            </Form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
