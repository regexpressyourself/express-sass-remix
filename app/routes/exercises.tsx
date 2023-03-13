import {
  redirect,
  type LinksFunction,
  type LoaderFunction,
} from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Nav from "~/components/nav";
import stylesUrl from "~/styles/dash-item.css";
import mainStylesUrl from "~/styles/main.css";
import { getUser } from "~/utils/session.server";

export const links: LinksFunction = () => {
  return [
    { prefetch: "intent", rel: "stylesheet", href: stylesUrl },
    { prefetch: "intent", rel: "stylesheet", href: mainStylesUrl },
  ];
};

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  exerciseListItems: Array<{ id: string; name: string }>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await getUser(request);
  if (!params.exerciseId && !request.url.includes("new")) {
    return redirect("/dashboard");
  } else {
    return { user };
  }
};

export default function ExercisesRoute() {
  const loaderData = useLoaderData<LoaderData>();
  const { user } = loaderData;
  return (
    <main className="main">
      <Nav user={user} />
      <Outlet></Outlet>
    </main>
  );
}
