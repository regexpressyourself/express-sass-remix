import type { Exercise } from "@prisma/client";
import { useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { ActionMeta, MultiValue } from "react-select";
import { Form, Link } from "remix";
import type { WorkoutWithExercises } from "~/types/db-includes";
import type {
  ExerciseList,
  ExerciseOrder,
  ExerciseSelect,
} from "~/types/workout";
import { List } from "../list";
import { AddExerciseToWorkout } from "./add-exercise-to-workout";
import { DeleteWorkout } from "./delete-workout";

export function WorkoutDisplay({
  workout,
  isOwner,
  exercises,
  canDelete = true,
  canEdit = true,
  showDeleteModal,
  setShowDeleteModal,
  setShowAddExerciseModal,
  showAddExerciseModal,
}: {
  workout: WorkoutWithExercises;
  exercises: Exercise[];
  isOwner: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  showDeleteModal?: boolean;
  showAddExerciseModal?: boolean;
  setShowDeleteModal: (value: boolean) => void;
  setShowAddExerciseModal: (value: boolean) => void;
}) {
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [exerciseOrder, setExerciseOrder] = useState<ExerciseOrder>(
    (workout.exerciseOrder as ExerciseOrder) || {}
  );
  const [currentExercisesSelect, setCurrentExercisesSelect] = useState<
    ExerciseSelect[]
  >([]);
  const [currentExercisesList, setCurrentExercisesList] = useState<
    ExerciseList[]
  >([]);
  const [excludedExercises, setExcludedExercises] = useState<Exercise[]>([]);
  const [inlcudedExercises, setIncludedExercises] = useState<
    (Exercise | ExerciseList)[]
  >([]);

  const submit = useSubmit();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const nextIncludedExercises: Exercise[] = [];
    const nextExcludedExercises: Exercise[] = [];
    const workoutExercises: { [key: string]: boolean } = {};

    const nextCurrentExercisesSelect: ExerciseSelect[] = [
      ...currentExercisesSelect,
    ];
    const nextCurrentExercisesList: ExerciseList[] = [...currentExercisesList];

    workout?.exercises.forEach((exercise: Exercise) => {
      nextCurrentExercisesSelect[exerciseOrder[exercise.id]] = {
        value: exercise.id,
        label: exercise.name,
      };
      nextCurrentExercisesList[exerciseOrder[exercise.id]] = {
        id: exercise.id,
        text: exercise.name,
      };
      nextIncludedExercises.push(exercise);
      workoutExercises[exercise.id] = true;
    });

    exercises.forEach((exercise) => {
      if (!workoutExercises[exercise.id]) {
        nextExcludedExercises.push(exercise);
      }
    });

    setIncludedExercises(nextIncludedExercises);
    setExcludedExercises(nextExcludedExercises);
    setCurrentExercisesList(nextCurrentExercisesList);
    setCurrentExercisesSelect(nextCurrentExercisesSelect);
  }, [workout, exercises]);

  return (
    <div className="container form-container">
      <div className="item-header">
        <h1>
          <Link to=".">{workout.name}</Link>
        </h1>

        {isOwner && setShowDeleteModal ? (
          <button
            type="submit"
            className="button danger w-100"
            disabled={!canDelete}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Workout
          </button>
        ) : null}
      </div>
      {isOwner ? (
        <Form method="post" ref={form}>
          <input type="hidden" name="_method" value="patch" />
          <input type="hidden" name="_removedExerciseIds" value={removedIds} />
          <input
            type="hidden"
            name="_exercises"
            value={inlcudedExercises.map((exercise) => exercise.id)}
          />
          <input
            type="hidden"
            name="_exerciseOrder"
            value={JSON.stringify(exerciseOrder)}
          />
          <label htmlFor="name">Workout Name</label>
          <input
            type="text"
            name="name"
            onBlur={() => {
              if (form?.current) {
                submit(form.current, { replace: true });
              }
            }}
            id="name"
            defaultValue={workout.name}
          />
          {currentExercisesList.length > 0 ? (
            <DndProvider backend={HTML5Backend}>
              <List
                order={exerciseOrder}
                onChange={() => {
                  if (form?.current) {
                    submit(form.current, { replace: true });
                  }
                }}
                setOrder={setExerciseOrder}
                items={currentExercisesList}
              />
            </DndProvider>
          ) : null}

          <button
            onClick={() => setShowAddExerciseModal(true)}
            className="button info add-list-button w-100"
            type="button"
            disabled={!canEdit}
          >
            Add Exercise
          </button>

          <AddExerciseToWorkout
            options={excludedExercises.map((exercise) => ({
              label: exercise.name,
              value: exercise.id,
            }))}
            onChange={(
              event: MultiValue<ExerciseSelect>,
              action: ActionMeta<ExerciseSelect>
            ) => {
              if (
                action.action === "remove-value" &&
                action?.removedValue?.value
              ) {
                setRemovedIds([...removedIds, action.removedValue.value]);
                setIncludedExercises([]);
              } else if (
                action?.option?.value &&
                action.action === "select-option"
              ) {
                const chosenExercises = excludedExercises
                  .filter((exercise) => exercise.id === action?.option?.value)
                  .map((exercise) => {
                    return { id: exercise.id, text: exercise.name };
                  });

                const nextExerciseOrders: { [id: string]: number } = {};
                chosenExercises.forEach((exercise, i) => {
                  nextExerciseOrders[exercise.id] =
                    inlcudedExercises.length + i;
                });

                const nextExcludedExercises = [
                  ...excludedExercises.filter(
                    (exercise) => exercise.id !== action?.option?.value
                  ),
                ];

                setExerciseOrder({ ...exerciseOrder, ...nextExerciseOrders });
                setIncludedExercises([
                  ...inlcudedExercises,
                  ...chosenExercises,
                ]);
                setExcludedExercises(nextExcludedExercises);
                setCurrentExercisesList([
                  ...currentExercisesList,
                  ...chosenExercises,
                ]);
              }
            }}
            display={showAddExerciseModal}
            setShowAddExerciseModal={setShowAddExerciseModal}
          />
        </Form>
      ) : null}
      <br />
      <br />

      {showDeleteModal ? (
        <DeleteWorkout
          workout={workout}
          isOwner={isOwner}
          canDelete={canDelete}
          display={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
        />
      ) : null}
    </div>
  );
}
