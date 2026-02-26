import type { QueryClient } from '@tanstack/react-query';

/**
 * Updates all cached 'messages' queries with the provided updater function.
 * Handles both flat arrays and infinite data page structures.
 */
export const updateMessagesCache = (queryClient: QueryClient, updater: (msg: any) => any) => {
    queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
            return old.map(updater);
        }
        if (Array.isArray(old.pages)) {
            const pages = old.pages.map((p: any) => ({
                ...p,
                messages: (p.messages || []).map(updater),
            }));
            return { ...old, pages };
        }
        return old;
    });
};

/**
 * Adds or updates a message in all 'messages' queries.
 * For paginated data, it updates the message if it exists, otherwise appends it to the last page.
 */
export const upsertMessageInCache = (queryClient: QueryClient, message: any) => {
    queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;

        // Flat array handling
        if (Array.isArray(old)) {
            const exists = old.some((m: any) => String(m.id) === String(message.id));
            if (exists) {
                return old.map((m: any) => (String(m.id) === String(message.id) ? { ...m, ...message } : m));
            }
            return [...old, message];
        }

        // Infinite data handling
        if (Array.isArray(old.pages)) {
            if (old.pages.length === 0) {
                return { ...old, pages: [{ messages: [message], nextCursor: null }] };
            }

            const existsAnywhere = old.pages.some((pg: any) =>
                (pg.messages || []).some((m: any) => String(m.id) === String(message.id))
            );

            const pages = old.pages.map((p: any, idx: number) => {
                const isLastPage = idx === old.pages.length - 1;
                const existsInPage = (p.messages || []).some((m: any) => String(m.id) === String(message.id));

                if (existsInPage) {
                    // Update the existing message
                    return {
                        ...p,
                        messages: p.messages.map((m: any) =>
                            String(m.id) === String(message.id) ? { ...m, ...message } : m
                        )
                    };
                }

                if (isLastPage && !existsAnywhere) {
                    // Append to the last page if it's completely new
                    return { ...p, messages: [...(p.messages || []), message] };
                }

                return p;
            });

            return { ...old, pages };
        }
        return old;
    });
};
