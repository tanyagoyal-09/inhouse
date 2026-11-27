import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Remembers the path the user was on *before* the current one.
 * Used only to avoid pushing a duplicate history entry when a form finishes
 * and returns to the page it was opened from (see useFinishTo).
 */
const PreviousPathContext = createContext<() => string | null>(() => null);

export function NavigationTracker({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const current = useRef(pathname);
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (current.current !== pathname) {
      previous.current = current.current;
      current.current = pathname;
    }
  }, [pathname]);

  const getPreviousPath = useCallback(() => previous.current, []);

  return (
    <PreviousPathContext.Provider value={getPreviousPath}>
      {children}
    </PreviousPathContext.Provider>
  );
}

/**
 * Real "Back" behaviour.
 *
 * - If the user arrived through in-app navigation (or reloaded such a page)
 *   this is exactly the browser Back button: `navigate(-1)`.
 * - If this is the first entry of the session (bookmark / pasted link / new
 *   tab) there is nothing to go back to inside the app, so go to `fallback`
 *   using `replace` – otherwise Back would immediately return here.
 *
 * It never forces the user to the dashboard when real history exists.
 */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [location.key, navigate, fallback]);
}

/**
 * Leave a create/edit form after saving and land on `target`.
 *
 * If the form was opened *from* `target`, step back to that existing history
 * entry; otherwise replace the form's entry with `target`. Either way no
 * duplicate entry is added and Back never returns to the finished form.
 */
export function useFinishTo(target: string) {
  const navigate = useNavigate();
  const getPreviousPath = useContext(PreviousPathContext);

  return useCallback(() => {
    if (getPreviousPath() === target) {
      navigate(-1);
    } else {
      navigate(target, { replace: true });
    }
  }, [getPreviousPath, navigate, target]);
}
