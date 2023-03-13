import type { WorkoutSet } from "@prisma/client";
import { Form, useSubmit } from "@remix-run/react";
import { useRef } from "react";
import { Check, CornerDownLeft, X } from "react-feather";

export function WorkoutSetItem({
  workoutSet,
  previousSet,
  setShowDeleteModal,
  setWorkoutSetToDelete,
}: {
  workoutSet: WorkoutSet;
  previousSet?: WorkoutSet;
  setShowDeleteModal: (val: boolean) => void;
  setWorkoutSetToDelete: (val: WorkoutSet) => void;
}) {
  const form = useRef<HTMLFormElement>(null);

  const submit = useSubmit();

  return (
    <div key={workoutSet.id}>
      <div className="set-item">
        <span className="set-num">
          {!workoutSet.isComplete ? null : <strong>Complete</strong>}
          <br />
          Set: {workoutSet.setNum}
        </span>
        <button
          onClick={() => {
            setShowDeleteModal(true);
            setWorkoutSetToDelete(workoutSet);
          }}
          className="button danger"
        >
          <X />
        </button>
        <Form ref={form} className="update-set-form" method="post">
          <input type="hidden" name="_method" value="update-set" />
          <input type="hidden" name="_set-id" value={workoutSet.id} />
          <span>
            <label htmlFor="number">Weight</label>
            <input
              onBlur={() => {
                if (form?.current) {
                  submit(form.current, { replace: false });
                }
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="_weight"
              defaultValue={
                workoutSet.weight || (previousSet?.weight as unknown as string) || ''
              }
            ></input>
          </span>
          <span>
            <label htmlFor="reps">Reps</label>
            <input
              onBlur={() => {
                if (form?.current) {
                  submit(form.current, { replace: false });
                }
              }}
              defaultValue={
                workoutSet.reps || (previousSet?.reps as unknown as string) || ''
              }
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="_reps"
            ></input>
          </span>
        </Form>
        {!workoutSet.isComplete ? (
          <Form method="post">
            <input type="hidden" name="_method" value="complete-set" />
            <input type="hidden" name="_set-id" value={workoutSet.id} />
            <button type="submit" className="button ">
              <Check />
            </button>
          </Form>
        ) : (
          <Form method="post">
            <input type="hidden" name="_method" value="uncomplete-set" />
            <input type="hidden" name="_set-id" value={workoutSet.id} />
            <button type="submit" className="button ">
              <CornerDownLeft />
            </button>
          </Form>
        )}
      </div>
      <div className="set-item" key={workoutSet.id}>
        <span></span>
      </div>
    </div>
  );
}
