import { useEffect, useRef, useState } from "react";
import { X } from "react-feather";
import type { ActionMeta, MultiValue } from "react-select";
import Select from "react-select";
import type { ExerciseSelect } from "~/types/workout";

export function AddExerciseToWorkout({
  display = false,
  setShowAddExerciseModal,
  onChange,
  options,
}: {
  display?: boolean;
  setShowAddExerciseModal: (value: boolean) => void;
  onChange: (
    event: MultiValue<ExerciseSelect>,
    action: ActionMeta<ExerciseSelect>
  ) => void;

  options: ExerciseSelect[];
}) {
  const [selected, setSelected] = useState<MultiValue<ExerciseSelect>>([]);

  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    backdropRef?.current?.addEventListener("click", (e) => {
      if (
        e?.target instanceof HTMLElement &&
        e?.target?.className?.includes("modal-backdrop")
      ) {
        setShowAddExerciseModal(false);
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
            setShowAddExerciseModal(false);
          }}
        >
          <X />
        </button>
        <h2>Add Exercise</h2>

        <div className="content">
          <label htmlFor="workouts">Exercises</label>
          <Select
            className="workout-select"
            id="workouts"
            value={selected}
            onChange={(
              event: MultiValue<ExerciseSelect>,
              action: ActionMeta<ExerciseSelect>
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
              setShowAddExerciseModal(false);
              setSelected([]);
            }}
            className="button modal-action"
            type="submit"
          >
            Add Exercise
          </button>
        </div>
      </div>
    </div>
  );
}
