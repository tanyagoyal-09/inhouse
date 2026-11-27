import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * On forward navigation (link click) start the new page at the top and move
 * keyboard/screen-reader focus to the main region. On Back/Forward (POP)
 * the browser's own scroll restoration is left alone.
 */
export function ScrollManager() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (navigationType === "POP") return;

    window.scrollTo(0, 0);
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [pathname, navigationType]);

  return null;
}
