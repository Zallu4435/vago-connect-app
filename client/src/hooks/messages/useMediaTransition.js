import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage media loading state and prevent flicker during local-to-remote URL swaps.
 * 
 * @param {Object} message - The message object
 * @param {string} componentName - Tag for logging
 * @returns {Object} { isLoaded, setIsLoaded, isLocal }
 */
export const useMediaTransition = (message, componentName = "MediaMessage") => {
    const [isLoaded, setIsLoaded] = useState(false);
    const isLocal = !!message?.isLocal;
    const prevContentRef = useRef(message?.content || message?.message);

    useEffect(() => {
        const content = message?.content || message?.message;

        // Check if this is a transition from local preview (blob:) to remote URL (http/https)
        const wasLocalPreview = prevContentRef.current?.startsWith('blob:');
        const isRemoteURL = content && !content.startsWith('blob:');
        const isSwap = wasLocalPreview && isRemoteURL;

        if (!isSwap) {
            setIsLoaded(false);
        } else {
            console.log(`[${componentName}] Skipping loading reset for local-to-remote swap.`);
        }

        prevContentRef.current = content;
    }, [message?.content, message?.message, message?.id, isLocal, componentName]);

    return { isLoaded, setIsLoaded, isLocal };
};
