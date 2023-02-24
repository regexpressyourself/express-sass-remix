import type { LinksFunction, LoaderFunction } from "remix";
import { Link, Outlet, useLoaderData } from "remix";
import Nav from "~/components/nav";
import mainStylesUrl from "~/styles/main.css";
import stylesUrl from "~/styles/routines.css";
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
  const routineListItems = await db.routine.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  const workoutListItems = await db.workout.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  const exerciseListItems = await db.exercise.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  const user = await getUser(request);

  const data: LoaderData = {
    routineListItems,
    workoutListItems,
    exerciseListItems,
    user,
  };
  return data;
};

export default function RoutinesRoute() {
  const data = useLoaderData<LoaderData>();
  const { user } = data;

  return (
    <div className="routines-layout">
      <Nav user={user} />
      <main className="routines-main">
        <div className="container">
          <div className="routines-list">
            <p>Here are your routines:</p>
            <ul>
              {data.routineListItems.map((routine) => (
                <li key={routine.id}>
                  <Link to={`/routines/${routine.id}`}>{routine.name}</Link>
                </li>
              ))}
            </ul>
            <Link to="/routines/new" className="button">
              Add Routine
            </Link>
          </div>
          <div className="routines-list">
            <p>Here are your workouts:</p>
            <ul>
              {data.workoutListItems.map((workout) => (
                <li key={workout.id}>
                  <Link to={`/workouts/${workout.id}`}>{workout.name}</Link>
                </li>
              ))}
            </ul>
            <Link to="/workouts/new" className="button">
              Add Workout
            </Link>
          </div>
          <div className="routines-list">
            <p>Here are your exercises:</p>
            <ul>
              {data.exerciseListItems.map((exercise) => (
                <li key={exercise.id}>
                  <Link to={`/exercises/${exercise.id}`}>{exercise.name}</Link>
                </li>
              ))}
            </ul>
            <Link to="/exercises/new" className="button">
              Add Exercise
            </Link>
          </div>
          <div className="routines-outlet">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
