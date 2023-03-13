import type { WorkoutSet } from "@prisma/client";
import { Form } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { X } from "react-feather";

export function DeleteWorkoutSet({
  workoutSet,
  isOwner,
  canDelete = true,
  display = false,
  setShowDeleteModal,
}: {
  workoutSet: WorkoutSet;
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
        <h2>Delete Set</h2>
        <div className="content">
          {isOwner ? (
            <Form method="post">
              <input type="hidden" name="_method" value="delete-set" />

              <input
                type="hidden"
                name="_workout-id"
                value={workoutSet.setWorkout}
              />
              <input type="hidden" name="_set-num" value={workoutSet.setNum} />
              <input
                type="hidden"
                name="_exercise-id"
                value={workoutSet.setExercise}
              />
              <input type="hidden" name="_set-id" value={workoutSet.id} />

              <button
                type="submit"
                className="button modal-action danger"
                disabled={!canDelete}
              >
                Delete Set
              </button>
            </Form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
