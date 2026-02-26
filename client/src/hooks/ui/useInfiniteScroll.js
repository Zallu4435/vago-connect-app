import { useEffect, useRef } from "react";

/**
 * A custom hook to handle infinite scroll pagination using IntersectionObserver.
 * 
 * @param {Object} options - Hook options
 * @param {boolean} options.hasNextPage - Whether there is more data to fetch.
 * @param {boolean} options.isFetchingNextPage - Whether the next page is currently being fetched.
 * @param {boolean} options.isLoading - Whether the initial data is currently loading.
 * @param {Function} options.fetchNextPage - Function to call when the sentinel comes into view.
 * @param {string} [options.rootMargin="200px"] - The root margin for the IntersectionObserver.
 * @returns {React.MutableRefObject} A ref to be attached to the sentinel element.
 */
export function useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchNextPage,
    rootMargin = "200px",
    containerRef = null,
    onScroll = null,
}) {
    const sentinelRef = useRef(null);

    // IntersectionObserver logic
    useEffect(() => {
        if (!hasNextPage || isFetchingNextPage || isLoading) return;

        const el = sentinelRef.current;
        const rootOptions = containerRef?.current ? { root: containerRef.current, rootMargin } : { rootMargin };

        if (!el) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                fetchNextPage();
            }
        }, rootOptions);

        observer.observe(el);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, rootMargin, containerRef]);

    // Optional manual scroll tracking logic
    useEffect(() => {
        if (!containerRef || !containerRef.current || !onScroll) return;

        const handleScroll = (e) => {
            const el = e.currentTarget;
            if (!el) return;
            const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
            onScroll({ e, distanceFromBottom, el });
        };

        const scroller = containerRef.current;
        scroller.addEventListener('scroll', handleScroll, { passive: true });
        return () => scroller.removeEventListener('scroll', handleScroll);
    }, [containerRef, onScroll]);

    return sentinelRef;
}
