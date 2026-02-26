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

/**
 * Updates a specific contact's profile information in all 'contacts' queries.
 * Supports both paginated and flat-array cache structures.
 */
export const updateContactProfileInCache = (queryClient: QueryClient, userId: string | number, updatedData: any) => {
    queryClient.setQueriesData({ queryKey: ['contacts'] }, (oldData: any) => {
        if (!oldData) return oldData;

        const updateContact = (contact: any) => {
            if (contact.id === String(userId)) {
                return {
                    ...contact,
                    name: updatedData.name ?? contact.name,
                    about: updatedData.about ?? contact.about,
                    profilePicture: updatedData.profileImage || updatedData.image || contact.profilePicture,
                };
            }
            return contact;
        };

        // Handle paginated queries
        if (oldData.pages) {
            return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                    ...page,
                    contacts: page.contacts?.map(updateContact),
                })),
            };
        }

        // Handle non-paginated array queries
        if (Array.isArray(oldData)) {
            return oldData.map(updateContact);
        }

        return oldData;
    });
};

/**
 * Updates a specific group's profile information in all 'contacts' queries and 'group' queries.
 * Supports both paginated and flat-array cache structures.
 */
export const updateGroupProfileInCache = (queryClient: QueryClient, conversationId: string | number, updatedData: any) => {
    // 1. Update contacts query instances
    queryClient.setQueriesData({ queryKey: ['contacts'] }, (oldData: any) => {
        if (!oldData) return oldData;

        const updateContact = (contact: any) => {
            if (contact.conversationId && String(contact.conversationId) === String(conversationId)) {
                return {
                    ...contact,
                    name: updatedData.groupName ?? contact.name,
                    description: updatedData.groupDescription ?? contact.description,
                    profilePicture: updatedData.groupIcon ?? contact.profilePicture,
                    groupName: updatedData.groupName ?? contact.groupName,
                    groupDescription: updatedData.groupDescription ?? contact.groupDescription,
                    groupIcon: updatedData.groupIcon ?? contact.groupIcon,
                };
            }
            return contact;
        };

        // Handle paginated queries
        if (oldData.pages) {
            return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                    ...page,
                    contacts: page.contacts?.map(updateContact),
                })),
            };
        }

        // Handle non-paginated array queries
        if (Array.isArray(oldData)) {
            return oldData.map(updateContact);
        }

        return oldData;
    });

    // 2. Update group specific query instances if they exist
    queryClient.setQueriesData({ queryKey: ['group'] }, (oldGroupData: any) => {
        if (!oldGroupData) return oldGroupData;

        // Single group detail object
        if (oldGroupData.id && String(oldGroupData.id) === String(conversationId)) {
            return {
                ...oldGroupData,
                groupName: updatedData.groupName ?? oldGroupData.groupName,
                groupDescription: updatedData.groupDescription ?? oldGroupData.groupDescription,
                groupIcon: updatedData.groupIcon ?? oldGroupData.groupIcon,
            };
        }

        // Arrays of groups (if any)
        if (Array.isArray(oldGroupData)) {
            return oldGroupData.map((g: any) => {
                if (String(g.id) === String(conversationId)) {
                    return {
                        ...g,
                        groupName: updatedData.groupName ?? g.groupName,
                        groupDescription: updatedData.groupDescription ?? g.groupDescription,
                        groupIcon: updatedData.groupIcon ?? g.groupIcon,
                    };
                }
                return g;
            });
        }

        return oldGroupData;
    });
};
