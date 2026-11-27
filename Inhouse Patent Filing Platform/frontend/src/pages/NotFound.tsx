import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { homePathFor } from "../auth/paths";
import { BackButton } from "../components/ui/BackButton";

/** Shown for any URL that matches no route. */
export function NotFound() {
  const { user } = useAuth();
  const home = user ? homePathFor(user.role) : "/";

  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="font-display text-6xl font-bold text-brand">404</p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
        The page you are looking for does not exist or may have moved. Check the address, or use one
        of the options below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to={home} replace className="btn-primary">
          {user ? "Go to your workspace" : "Go to home page"}
        </Link>
        <BackButton fallback={home} label="Go back" />
      </div>
    </section>
  );
}
