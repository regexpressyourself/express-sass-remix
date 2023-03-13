import { Form, Link } from "@remix-run/react";
import { getUser } from "~/utils/session.server";

export default function Nav({
  user,
}: {
  user?: Awaited<ReturnType<typeof getUser>>;
}) {
  return (
    <header className="main-header">
      <div className="container">
        <h1 className="home-link">
          <Link to="/dashboard" title="WorkInOut" aria-label="WorkInOut">
            <span className="logo">🏋️ </span>
            <span className="logo-medium">🏋️ WorkInOut</span>
          </Link>
        </h1>
        {user ? (
          <div className="user-info">
            <span>{`Hi ${user.username}`}</span>
            <Form action="/logout" method="post">
              <button type="submit" className="button logout">
                Logout
              </button>
            </Form>
          </div>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </header>
  );
}
