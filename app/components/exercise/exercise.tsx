import type { Exercise } from "@prisma/client";
import { Link } from "remix";
import { DeleteExercise } from "./delete-exercise";
import { EditExercise } from "./edit-exercise";

export function ExerciseDisplay({
  exercise,
  isOwner,
  canDelete = true,
  showEditModal,
  showDeleteModal,
  setShowEditModal,
  setShowDeleteModal,
}: {
  exercise: Pick<Exercise, "name">;
  isOwner: boolean;
  canDelete?: boolean;
  showEditModal?: boolean;
  showDeleteModal?: boolean;
  setShowEditModal?: (value: boolean) => void;
  setShowDeleteModal?: (value: boolean) => void;
}) {
  return (
    <div className="container">
      <p>Here's your exercise:</p>
      <Link to=".">{exercise.name}</Link>
      <div>
        {isOwner && setShowDeleteModal ? (
          <button
            type="submit"
            className="button"
            disabled={!canDelete}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </button>
        ) : null}
      </div>
      <div>
        {isOwner && setShowEditModal ? (
          <button
            type="submit"
            className="button"
            disabled={!canDelete}
            onClick={() => setShowEditModal(true)}
          >
            Edit
          </button>
        ) : null}
      </div>
      {showDeleteModal ? (
        <DeleteExercise
          exercise={exercise}
          isOwner={isOwner}
          canDelete={canDelete}
          display={showDeleteModal}
        />
      ) : null}
      {showEditModal ? (
        <EditExercise
          exerciseName={exercise.name}
          isOwner={isOwner}
          canEdit={canDelete}
          display={showEditModal}
        />
      ) : null}
    </div>
  );
}
