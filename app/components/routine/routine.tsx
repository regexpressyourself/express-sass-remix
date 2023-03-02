import type { Workout } from "@prisma/client";
import { useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { ActionMeta, MultiValue } from "react-select";
import { Form, Link } from "remix";
import type { RoutineWithWorkouts } from "~/types/db-includes";
import type { WorkoutList, WorkoutOrder, WorkoutSelect } from "~/types/routine";
import { List } from "../list";
import { DeleteWorkout } from "../workout/delete-workout";
import { AddWorkoutToRoutine } from "./add-workout-to-routine";
import { DeleteRoutine } from "./delete-routine";

export function RoutineDisplay({
  routine,
  isOwner,
  workouts,
  canDelete = true,
  canEdit = true,
  showDeleteModal,
  setShowDeleteModal,
  setShowAddWorkoutModal,
  showAddWorkoutModal,
  setShowDeleteWorkoutModal,
  showDeleteWorkoutModal
}: {
  routine: RoutineWithWorkouts;
  workouts: Workout[];
  isOwner: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  showDeleteModal?: boolean;
  showAddWorkoutModal?: boolean;
  showDeleteWorkoutModal?: boolean;
  setShowDeleteModal: (value: boolean) => void;
  setShowAddWorkoutModal: (value: boolean) => void;
  setShowDeleteWorkoutModal: (value: boolean) => void;
}) {
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
  const [workoutOrder, setWorkoutOrder] = useState<WorkoutOrder>(
    (routine.workoutOrder as WorkoutOrder) || {}
  );
  const [currentWorkoutsSelect, setCurrentWorkoutsSelect] = useState<
    WorkoutSelect[]
  >([]);
  const [currentWorkoutsList, setCurrentWorkoutsList] = useState<WorkoutList[]>(
    []
  );
  const [excludedWorkouts, setExcludedWorkouts] = useState<Workout[]>([]);
  console.log("excludedWorkouts");
  console.log(excludedWorkouts);
  const [includedWorkouts, setIncludedWorkouts] = useState<
    (Workout | WorkoutList)[]
  >([]);

  console.log("includedWorkouts");
  console.log(includedWorkouts);
  const submit = useSubmit();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const nextIncludedWorkouts: Workout[] = [];
    const nextExcludedWorkouts: Workout[] = [];
    const routineWorkouts: { [key: string]: boolean } = {};

    const nextCurrentWorkoutsSelect: WorkoutSelect[] = [
      ...currentWorkoutsSelect,
    ];
    const nextCurrentWorkoutsList: WorkoutList[] = [...currentWorkoutsList];

    routine?.workouts.forEach((workout: Workout) => {
      nextCurrentWorkoutsSelect[workoutOrder[workout.id]] = {
        value: workout.id,
        label: workout.name,
      };
      nextCurrentWorkoutsList[workoutOrder[workout.id]] = {
        id: workout.id,
        text: workout.name,
      };
      nextIncludedWorkouts.push(workout);
      routineWorkouts[workout.id] = true;
    });

    workouts.forEach((workout) => {
      if (!routineWorkouts[workout.id]) {
        nextExcludedWorkouts.push(workout);
      }
    });

    setIncludedWorkouts(nextIncludedWorkouts);
    setExcludedWorkouts(nextExcludedWorkouts);
    setCurrentWorkoutsList(nextCurrentWorkoutsList);
    setCurrentWorkoutsSelect(nextCurrentWorkoutsSelect);
  }, [routine, workouts]);

  return (
    <div className="container form-container">
      <div className="item-header">
        <h1>
          <Link to=".">{routine.name}</Link>
        </h1>

        {isOwner && setShowDeleteModal ? (
          <button
            type="submit"
            className="button danger w-100"
            disabled={!canDelete}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Routine
          </button>
        ) : null}
      </div>
      {isOwner ? (
        <Form method="post" ref={form}>
          <input type="hidden" name="_method" value="patch" />
          <input type="hidden" name="_removedWorkoutIds" value={removedIds} />
          <input
            type="hidden"
            name="_workouts"
            value={includedWorkouts.map((workout) => workout.id)}
          />
          <input
            type="hidden"
            name="_workoutOrder"
            value={JSON.stringify(workoutOrder)}
          />
          <label htmlFor="name">Routine Name</label>
          <input
            type="text"
            name="name"
            onBlur={() => {
              if (form?.current) {
                submit(form.current, { replace: true });
              }
            }}
            id="name"
            defaultValue={routine.name}
          />
          {currentWorkoutsList.length > 0 ? (
            <DndProvider backend={HTML5Backend}>
              <List
                onDelete={(id: string) => {
                  setWorkoutToDelete(
                    workouts.find((workout) => workout.id === id) || null
                  );
                  setShowDeleteWorkoutModal(true);
                }}
                order={workoutOrder}
                onChange={() => {
                  if (form?.current) {
                    submit(form.current, { replace: true });
                  }
                }}
                setOrder={setWorkoutOrder}
                items={currentWorkoutsList}
              />
            </DndProvider>
          ) : null}

          <button
            onClick={() => setShowAddWorkoutModal(true)}
            className="button info add-list-button w-100"
            type="button"
            disabled={!canEdit}
          >
            Add Workout
          </button>

          <AddWorkoutToRoutine
            options={excludedWorkouts.map((workout) => ({
              label: workout.name,
              value: workout.id,
            }))}
            onChange={(
              event: MultiValue<WorkoutSelect>,
              action: ActionMeta<WorkoutSelect>
            ) => {
              if (
                action.action === "remove-value" &&
                action?.removedValue?.value
              ) {
                setRemovedIds([...removedIds, action.removedValue.value]);
                setIncludedWorkouts([]);
              } else if (
                action?.option?.value &&
                action.action === "select-option"
              ) {
                const chosenWorkouts = excludedWorkouts
                  .filter((workout) => workout.id === action?.option?.value)
                  .map((workout) => {
                    return { id: workout.id, text: workout.name };
                  });

                const nextWorkoutOrders: { [id: string]: number } = {};
                chosenWorkouts.forEach((workout, i) => {
                  nextWorkoutOrders[workout.id] = includedWorkouts.length + i;
                });

                const nextExcludedWorkouts = [
                  ...excludedWorkouts.filter(
                    (workout) => workout.id !== action?.option?.value
                  ),
                ];

                setWorkoutOrder({ ...workoutOrder, ...nextWorkoutOrders });
                setIncludedWorkouts([...includedWorkouts, ...chosenWorkouts]);
                setExcludedWorkouts(nextExcludedWorkouts);
                setCurrentWorkoutsList([
                  ...currentWorkoutsList,
                  ...chosenWorkouts,
                ]);
              }
            }}
            display={showAddWorkoutModal}
            setShowAddWorkoutModal={setShowAddWorkoutModal}
          />
        </Form>
      ) : null}
      <br />
      <br />

      {showDeleteModal ? (
        <DeleteRoutine
          routine={routine}
          isOwner={isOwner}
          canDelete={canDelete}
          display={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
        />
      ) : null}
      {showDeleteWorkoutModal ? (
        <DeleteWorkout
          workout={workoutToDelete}
          isOwner={isOwner}
          canDelete={canDelete}
          display={showDeleteWorkoutModal}
          setShowDeleteModal={setShowDeleteWorkoutModal}
        />
      ) : null}
    </div>
  );
}
