"use client";
import { useEffect, RefObject } from "react";

/**
 * Hook that handles clicks outside of a specified set of elements,
 * and also listens for "Escape" key presses to close the component.
 *
 * @param {boolean} isOpen - Whether the component is currently open
 * @param {Function} onClose - Function to call when clicked outside or Escape is pressed
 * @param {Array<React.RefObject>} refs - Array of refs that should NOT trigger the close (e.g., the modal itself and its trigger button)
 */
export function useClickOutside(
    isOpen: boolean,
    onClose: () => void,
    refs: Array<RefObject<HTMLElement | null>> = []
) {
    useEffect(() => {
        if (!isOpen) return;

        const onDocClick = (e) => {
            // Check if the click target is inside ANY of the passed refs
            const isInside = refs.some(
                (ref) => ref?.current && ref.current.contains(e.target)
            );

            if (!isInside) {
                onClose();
            }
        };

        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };

        // Defer listener initialization to avoid immediately firing on the same click event
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", onDocClick);
            document.addEventListener("keydown", onKey);
            document.addEventListener("touchstart", onDocClick, { passive: true });
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("touchstart", onDocClick);
        };
    }, [isOpen, onClose, refs]);
}
