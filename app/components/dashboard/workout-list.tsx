import { Link } from "@remix-run/react";

export default function WorkoutList({
  workoutListItems,
  setShowWorkouts,
}: {
  setShowWorkouts: (val: boolean) => void;
  workoutListItems: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="dash-item-list">
      <h2>Workouts:</h2>
      {workoutListItems.length > 0 ? null : <p>No workouts to show!</p>}
      {workoutListItems.map((workout) => (
        <div key={workout.id}>
          <div className="routine-item" key={workout.id}>
            <Link to={`/workouts/${workout.id}`}>{workout.name}</Link>
            <Link to={`/workouts/${workout.id}/start`}>
              <button className="button">Start {workout.name}</button>
            </Link>
          </div>

          <hr />
        </div>
      ))}
      <button className="button" onClick={() => setShowWorkouts(false)}>
        Hide workouts
      </button>
    </div>
  );
}
