import type { Workout } from "@prisma/client";
import { Link } from "remix";
import type { RoutineWithWorkouts } from "~/types/db-includes";
import { DeleteRoutine } from "./delete-routine";
import { EditRoutine } from "./edit-routine";

export function RoutineDisplay({
  routine,
  isOwner,
  workouts,
  canDelete = true,
  showEditModal,
  showDeleteModal,
  setShowEditModal,
  setShowDeleteModal,
}: {
  routine: RoutineWithWorkouts;
  workouts: Workout[];
  isOwner: boolean;
  canDelete?: boolean;
  showEditModal?: boolean;
  showDeleteModal?: boolean;
  setShowEditModal: (value: boolean) => void;
  setShowDeleteModal: (value: boolean) => void;
}) {
  return (
    <div className="container">
      <p>Here's your routine:</p>
      <Link to=".">{routine.name}</Link>
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
        <DeleteRoutine
          routine={routine}
          isOwner={isOwner}
          canDelete={canDelete}
          display={showDeleteModal}
          setShowDeleteModal={() => setShowDeleteModal(true)}
        />
      ) : null}
      {showEditModal ? (
        <EditRoutine
          routine={routine}
          setShowEditModal={setShowEditModal}
          workouts={workouts}
          isOwner={isOwner}
          canEdit={canDelete}
          display={showEditModal}
        />
      ) : null}
    </div>
  );
}
