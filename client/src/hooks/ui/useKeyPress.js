import { useEffect } from 'react';

/**
 * A custom hook to listen for specific key presses globally.
 * 
 * @param {string | string[]} targetKey - The key(s) to listen for (e.g., 'Escape', 'Enter').
 * @param {Function} callback - The function to execute when the key is pressed.
 * @param {boolean} active - Whether the listener should be active (defaults to true).
 */
export function useKeyPress(targetKey, callback, active = true) {
    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (event) => {
            if (Array.isArray(targetKey)) {
                if (targetKey.includes(event.key)) {
                    callback(event);
                }
            } else if (event.key === targetKey) {
                callback(event);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [targetKey, callback, active]);
}
