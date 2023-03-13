import type { Exercise } from "@prisma/client";
import { Form, Link, useSubmit } from "@remix-run/react";
import { useRef } from "react";
import { DeleteExercise } from "./delete-exercise";

export function ExerciseDisplay({
  exercise,
  isOwner,
  canDelete = true,
  showDeleteModal,
  setShowDeleteModal,
}: {
  exercise: Exercise | {name: string;};
  isOwner: boolean;
  canDelete?: boolean;
  showDeleteModal?: boolean;
  setShowDeleteModal: (value: boolean) => void;
}) {
  const submit = useSubmit();
  const form = useRef<HTMLFormElement>(null);

  return (
    <div className="container form-container">
      <div className="item-header">
        <h1>
          <Link to=".">{exercise.name}</Link>
        </h1>

        {isOwner && setShowDeleteModal ? (
          <button
            type="submit"
            className="button danger w-100"
            disabled={!canDelete}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Exercise
          </button>
        ) : null}
      </div>
      {isOwner ? (
        <Form method="post" ref={form}>
          <input type="hidden" name="_method" value="patch" />
          <label htmlFor="name">Exercise Name</label>
          <input
            type="text"
            name="name"
            onBlur={() => {
              if (form?.current) {
                submit(form.current, { replace: true });
              }
            }}
            id="name"
            defaultValue={exercise.name}
          />
        </Form>
      ) : null}
      <br />
      <br />

      {showDeleteModal ? (
        <DeleteExercise
          exercise={exercise}
          isOwner={isOwner}
          canDelete={canDelete}
          display={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
        />
      ) : null}
    </div>
  );
}
