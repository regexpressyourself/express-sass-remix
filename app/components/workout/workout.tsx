import type { Workout } from "@prisma/client";
import { Link } from "remix";
import { DeleteWorkout } from "./delete-workout";
import { EditWorkout } from "./edit-workout";

export function WorkoutDisplay({
  workout,
  isOwner,
  canDelete = true,
  showEditModal,
  showDeleteModal,
  setShowEditModal,
  setShowDeleteModal,
}: {
  workout: Pick<Workout, "name">;
  isOwner: boolean;
  canDelete?: boolean;
  showEditModal?: boolean;
  showDeleteModal?: boolean;
  setShowEditModal?: (value: boolean) => void;
  setShowDeleteModal?: (value: boolean) => void;
}) {
  return (
    <div className="container">
      <p>Here's your workout:</p>
      <Link to=".">{workout.name}</Link>
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
        <DeleteWorkout
          workout={workout}
          isOwner={isOwner}
          canDelete={canDelete}
          display={showDeleteModal}
        />
      ) : null}
      {showEditModal ? (
        <EditWorkout
          workoutName={workout.name}
          isOwner={isOwner}
          canEdit={canDelete}
          display={showEditModal}
        />
      ) : null}
    </div>
  );
}
