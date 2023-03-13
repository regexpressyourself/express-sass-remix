import {
  redirect,
  type LinksFunction,
  type LoaderFunction,
} from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import ExerciseList from "~/components/dashboard/exercise-list";
import WorkoutList from "~/components/dashboard/workout-list";
import Nav from "~/components/nav";
import stylesUrl from "~/styles/dash-item.css";
import mainStylesUrl from "~/styles/main.css";
import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

export const links: LinksFunction = () => {
  return [
    { prefetch: "intent", rel: "stylesheet", href: stylesUrl },
    { prefetch: "intent", rel: "stylesheet", href: mainStylesUrl },
  ];
};

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  routineListItems: Array<{ id: string; name: string }>;
  workoutListItems: Array<{ id: string; name: string }>;
  exerciseListItems: Array<{ id: string; name: string }>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);
  if (!user) {
    return redirect("/login");
  }

  const routineListItems = await db.routine.findMany({
    where: { routineUser: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  const workoutListItems = await db.workout.findMany({
    where: { workoutUser: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  const exerciseListItems = await db.exercise.findMany({
    where: { exerciseUser: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const data: LoaderData = {
    routineListItems,
    workoutListItems,
    exerciseListItems,
    user,
  };
  return data;
};

export default function DashboardRoute() {
  const data = useLoaderData<LoaderData>();
  const { user } = data;
  const [showWorkouts, setShowWorkouts] = useState(false);
  const [showExercises, setShowExercises] = useState(false);

  return (
    <div className="dash-item-layout">
      <Nav user={user} />
      <main className="dash-item-main">
        <div className="container">
          <div className="dash-item-list">
            <h2>Routines:</h2>
            <Link to="/routines/new" className="button">
              Add Routine
            </Link>
            {data.routineListItems.map((routine) => (
              <div key={routine.id}>
                <div className="routine-item" key={routine.id}>
                  <Link to={`/routines/${routine.id}`}>{routine.name}</Link>
                </div>
                <hr />
              </div>
            ))}
          </div>
          {showWorkouts ? (
            <WorkoutList
              setShowWorkouts={setShowWorkouts}
              workoutListItems={data.workoutListItems}
            />
          ) : (
            <button className="button" onClick={() => setShowWorkouts(true)}>
              Show workouts
            </button>
          )}
          {showExercises ? (
            <ExerciseList
              setShowExercises={setShowExercises}
              exerciseListItems={data.exerciseListItems}
            />
          ) : (
            <button className="button" onClick={() => setShowExercises(true)}>
              Show exercises
            </button>
          )}
          <div className="dash-item-outlet">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
