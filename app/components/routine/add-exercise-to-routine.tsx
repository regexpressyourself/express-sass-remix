import { Link } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { Plus, X } from "react-feather";
import type { ActionMeta, MultiValue } from "react-select";
import Select from "react-select";
import type { ExerciseSelect } from "~/types/routine";

export function AddExerciseToRoutine({
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
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );

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

  useEffect(() => {
    setSearchParams(
      new URLSearchParams([
        ["redirectTo", new URL(window?.location?.href).pathname],
      ])
    );
  },[]);
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
          <label htmlFor="exercises">Exercises</label>
          <Select
            className="exercise-select"
            id="exercises"
            value={selected}
            onChange={(
              event: MultiValue<ExerciseSelect>,
              action: ActionMeta<ExerciseSelect>
            ) => {
              setSelected(event);
              onChange(event, action);
            }}
            name="exercises"
            isMulti
            options={options}
          />
          <div className="add-or-update-action">
            <Link to={`/exercises/new?${searchParams}`}>
              <button className="button ">
                <Plus />
              </button>
            </Link>
            <button
              onClick={() => {
                setShowAddExerciseModal(false);
                setSelected([]);
              }}
              className="button "
              type="submit"
            >
              Add exercise to routine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
