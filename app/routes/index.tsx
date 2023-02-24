import type { LinksFunction, LoaderFunction, MetaFunction } from "remix";
import { Link, redirect } from "remix";
import stylesUrl from "~/styles/index.css";
import mainStylesUrl from "~/styles/main.css";
import { getUserId } from "~/utils/session.server";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: stylesUrl },
    { rel: "stylesheet", href: mainStylesUrl },
  ];
};

export const meta: MetaFunction = () => ({
  title: "Remix: So great, it's funny!",
  description: "Remix routines app. Learn Remix and laugh at the same time!",
});

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) {
    redirect("/dashboard");
  }
  return {};
};

export default function Index() {
  return (
    <div className="container">
      <div className="content">
        <h1>WorkInOut</h1>
        <nav>
          <ul>
            <li>
              <Link to="login">Log In</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
