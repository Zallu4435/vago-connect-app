import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook to delay the unmounting of a component so exit animations can play.
 * 
 * @param {boolean} isMounted - Whether the component should be mounted (e.g., the `open` prop).
 * @param {number} delayTime - The duration of the exit animation in milliseconds.
 * @returns {boolean} `shouldRender` - True if the component should currently be in the DOM.
 */
export function useDelayUnmount(isMounted, delayTime = 200) {
    const [shouldRender, setShouldRender] = useState(false);
    const hideTimer = useRef(null);

    useEffect(() => {
        if (isMounted) {
            clearTimeout(hideTimer.current);
            setShouldRender(true);
        } else if (shouldRender) {
            hideTimer.current = setTimeout(() => {
                setShouldRender(false);
            }, delayTime);
        }

        return () => clearTimeout(hideTimer.current);
    }, [isMounted, delayTime, shouldRender]);

    return shouldRender;
}
