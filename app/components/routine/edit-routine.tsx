import type { Workout } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { X } from "react-feather";
import Select from "react-select";
import { Form } from "remix";
import type { RoutineWithWorkouts } from "~/types/db-includes";

export function EditRoutine({
  routine,
  workouts,
  isOwner,
  canEdit = true,
  setShowEditModal,
  display = false,
}: {
  routine: RoutineWithWorkouts;
  workouts: Workout[];
  isOwner: boolean;
  canEdit?: boolean;
  setShowEditModal: (value: boolean) => void;
  display?: boolean;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  useEffect(() => {
    backdropRef?.current?.addEventListener("click", (e) => {
      if (
        e?.target instanceof HTMLElement &&
        e?.target?.className?.includes("modal-backdrop")
      ) {
        setShowEditModal(false);
      }
    });
  }, []);

  const currentWorkouts = routine.workouts.map((workout) => {
    return {
      value: workout.id,
      label: workout.name,
    };
  });

  return (
    <div
      className={`modal-backdrop ${!display ? "hidden" : ""}`}
      ref={backdropRef}
    >
      <div className={`modal ${!display ? "hidden" : ""}`}>
        <button
          className="modal-x"
          onClick={() => {
            setShowEditModal(false);
          }}
        >
          <X />
        </button>
        <h2>Edit {routine.name}?</h2>
        {isOwner ? (
          <Form method="post">
            <input type="hidden" name="_method" value="patch" />
            <input type="hidden" name="_removedWorkoutIds" value={removedIds} />
            <label htmlFor="name">Routine Name</label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={routine.name}
            />
            <label htmlFor="workouts">Workouts</label>
            <Select
              id="workouts"
              onChange={(event, action) => {
                if (action.action === "remove-value") {
                  setRemovedIds([...removedIds, action.removedValue.value]);
                }
              }}
              name="workouts"
              defaultValue={currentWorkouts}
              isMulti
              options={workouts.map((workout) => {
                return {
                  value: workout.id,
                  label: workout.name,
                };
              })}
            />
            <button type="submit" className="button" disabled={!canEdit}>
              Edit
            </button>
          </Form>
        ) : null}
      </div>
    </div>
  );
}
