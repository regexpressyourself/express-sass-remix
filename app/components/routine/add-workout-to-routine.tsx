import { useEffect, useRef, useState } from "react";
import { X } from "react-feather";
import type { ActionMeta, MultiValue } from "react-select";
import Select from "react-select";
import type { WorkoutSelect } from "~/types/routine";

export function AddWorkoutToRoutine({
  display = false,
  setShowAddWorkoutModal,
  onChange,
  options,
}: {
  display?: boolean;
  setShowAddWorkoutModal: (value: boolean) => void;
  onChange: (
    event: MultiValue<WorkoutSelect>,
    action: ActionMeta<WorkoutSelect>
  ) => void;

  options: WorkoutSelect[];
}) {
  const [selected, setSelected] = useState<MultiValue<WorkoutSelect>>([]);

  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    backdropRef?.current?.addEventListener("click", (e) => {
      if (
        e?.target instanceof HTMLElement &&
        e?.target?.className?.includes("modal-backdrop")
      ) {
        setShowAddWorkoutModal(false);
      }
    });
  }, []);

  return (
    <div
      className={`modal-backdrop ${!display ? "hidden" : ""}`}
      ref={backdropRef}
    >
      <div className={`modal  ${!display ? "hidden" : ""}`}>
        <button
          className="modal-x"
          onClick={() => {
            setShowAddWorkoutModal(false);
          }}
        >
          <X />
        </button>
        <h2>Add Workout</h2>

        <div className="content">
          <label htmlFor="workouts">Workouts</label>
          <Select
            className="workout-select"
            id="workouts"
            value={selected}
            onChange={(
              event: MultiValue<WorkoutSelect>,
              action: ActionMeta<WorkoutSelect>
            ) => {
              setSelected(event);
              onChange(event, action);
            }}
            name="workouts"
            isMulti
            options={options}
          />
          <button
            onClick={() => {
              setShowAddWorkoutModal(false);
              setSelected([]);
            }}
            className="button modal-action"
            type="submit"
          >
            Add Workout
          </button>
        </div>
      </div>
    </div>
  );
}
