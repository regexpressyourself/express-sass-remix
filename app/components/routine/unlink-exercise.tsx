import type { Exercise } from "@prisma/client";
import { Form } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { X } from "react-feather";

export function UnlinkExercise({
  exercise,
  routineName,
  isOwner,
  canDelete = true,
  display = false,
  setShowDeleteModal,
}: {
  exercise: Exercise | null;
  isOwner: boolean;
  routineName: string;
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
        <h2>
          Remove {exercise?.name} from {routineName}?
        </h2>
        <div className="content">
          {isOwner ? (
            <Form method="post">
              <input type="hidden" name="_method" value="delete-exercise" />
              <input type="hidden" name="_id" value={exercise?.id} />
              <button
                type="submit"
                className="button modal-action danger"
                disabled={!canDelete}
              >
                Remove exercise from routine
              </button>
            </Form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
