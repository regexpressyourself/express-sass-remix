import type { LinksFunction, LoaderFunction } from "remix";
import { Outlet, redirect, useLoaderData } from "remix";
import Nav from "~/components/nav";
import mainStylesUrl from "~/styles/main.css";
import stylesUrl from "~/styles/routines.css";
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
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await getUser(request);
  if (!params.routineId && !request.url.includes('new')) {
    return redirect("/dashboard");
  } else {
    return { user };
  }
};

export default function RoutinesRoute() {
  const loaderData = useLoaderData<LoaderData>();
  const { user } = loaderData;
  return (
    <>
      <Nav user={user} />
      <Outlet></Outlet>
    </>
  );
}
