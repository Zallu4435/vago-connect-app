import { useState, useEffect } from 'react';

/**
 * Hook to asynchronously fetch a remote url as an audio blob.
 * Replaces inline fetches in audio player components.
 * 
 * @param {string} src - The URL of the audio file to fetch
 * @returns {Object} { blobUrl: string | null, isLoading: boolean, error: string | null }
 */
export const useAudioBlob = (src) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        let url = null;

        if (!src) return;

        // If it's already a blob proxy, no fetch needed
        if (src.startsWith('blob:')) {
            setBlobUrl(src);
            return;
        }

        const fetchAudio = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(src);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const blob = await response.blob();

                if (!active) return;

                url = URL.createObjectURL(blob);
                setBlobUrl(url);
            } catch (err) {
                if (!active) return;
                setError("Failed to load audio");
            } finally {
                if (active) setIsLoading(false);
            }
        };

        fetchAudio();

        return () => {
            active = false;
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [src]);

    return { blobUrl, isLoading, error };
};
