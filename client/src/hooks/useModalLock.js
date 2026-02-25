import { useEffect, useRef } from "react";

let lockCount = 0; // Reference-count so nested modals don't fight each other

/**
 * useModalLock
 *
 * When `open` is true:
 *  - Prevents body scroll (saves + restores scroll position)
 *  - Adds `data-modal-open` attribute to <html> so you can apply
 *    backdrop blur on the page content via CSS
 *
 * Usage:
 *   useModalLock(isOpen);
 *
 * CSS (in globals.css):
 *   html[data-modal-open] #page-root { filter: blur(3px); }
 */
export function useModalLock(open) {
    const savedScrollY = useRef(0);

    useEffect(() => {
        if (typeof document === "undefined") return;

        if (open) {
            lockCount++;

            if (lockCount === 1) {
                // Save current scroll, lock body
                savedScrollY.current = window.scrollY;
                document.body.style.overflow = "hidden";
                document.body.style.position = "fixed";
                document.body.style.top = `-${savedScrollY.current}px`;
                document.body.style.width = "100%";
                document.documentElement.setAttribute("data-modal-open", "true");
            }
        }

        return () => {
            if (open) {
                lockCount = Math.max(0, lockCount - 1);

                if (lockCount === 0) {
                    // Restore scroll
                    document.body.style.overflow = "";
                    document.body.style.position = "";
                    document.body.style.top = "";
                    document.body.style.width = "";
                    document.documentElement.removeAttribute("data-modal-open");
                    window.scrollTo(0, savedScrollY.current);
                }
            }
        };
    }, [open]);
}
