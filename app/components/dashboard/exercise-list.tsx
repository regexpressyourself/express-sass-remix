import { Link } from "@remix-run/react";

export default function ExerciseList({
  exerciseListItems,
  setShowExercises,
}: {
  exerciseListItems: Array<{ id: string; name: string }>;
  setShowExercises: (val: boolean) => void;
}) {
  return  (
    <div className="dash-item-list">
      <h2>Exercises:</h2>
      <Link to="/exercises/new" className="button">
        Add Exercise
      </Link>
      {exerciseListItems.map((exercise) => (
        <div key={exercise.id}>
          <div key={exercise.id}>
            <Link to={`/exercises/${exercise.id}`}>{exercise.name}</Link>
          </div>
          <hr />
        </div>
      ))}
      <button className="button" onClick={() => setShowExercises(false)}>
        Hide exercises
      </button>
    </div>
  );
}
