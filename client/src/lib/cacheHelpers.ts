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
 * If tempId is provided, it replaces the message with that tempId with the new message.
 * For paginated data, it updates the message if it exists, otherwise appends it to the last page.
 */
export const upsertMessageInCache = (queryClient: QueryClient, message: any, tempId?: string | number) => {
    const queries = queryClient.getQueryCache().findAll({ queryKey: ['messages'] });

    queries.forEach(query => {
        const qKey = query.queryKey;
        const cachePeerId = qKey && qKey.length >= 3 ? String(qKey[2]) : null;

        const idToSearch = tempId ? String(tempId) : null;
        const msgIdStr = String(message.id);
        const isMatchLocal = (m: any) => {
            const mid = String(m.id);
            return mid === msgIdStr || (idToSearch && mid === idToSearch);
        };

        // Determine if this message actually belongs in THIS specific cache
        const msgConvId = String(message.conversationId || "");
        const msgSenderId = String(message.senderId || "");
        const msgReceiverId = String(message.receiverId || "");

        let belongsToThisCache = false;
        if (cachePeerId) {
            // 1. Exact conversationId match (if message has one)
            if (msgConvId !== "0" && msgConvId === cachePeerId) {
                belongsToThisCache = true;
            }
            // 2. Peer matching (Direct chat fallback / Optimistic messages)
            else if (msgSenderId === cachePeerId || msgReceiverId === cachePeerId) {
                belongsToThisCache = true;
            }
        }

        if (!belongsToThisCache) return;

        queryClient.setQueryData(qKey, (old: any) => {
            if (!old) return old;

            // Flat array handling
            if (Array.isArray(old)) {
                const exists = old.some(isMatchLocal);
                if (exists) {
                    return old.map((m: any) => isMatchLocal(m) ? { ...m, ...message, id: message.id } : m);
                }
                return [message, ...old]; // Unshift into top (assuming newest first)
            }

            // Infinite data handling
            if (Array.isArray(old.pages)) {
                if (old.pages.length === 0) return old;

                const existsAnywhere = old.pages.some((pg: any) =>
                    (pg.messages || []).some(isMatchLocal)
                );

                const pages = old.pages.map((p: any, idx: number) => {
                    const isFirstPage = idx === 0;
                    const existsInPage = (p.messages || []).some(isMatchLocal);

                    if (existsInPage) {
                        return {
                            ...p,
                            messages: p.messages.map((m: any) =>
                                isMatchLocal(m) ? { ...m, ...message, id: message.id } : m
                            )
                        };
                    }

                    // If it's the first page (newest) and doesn't exist anywhere else, unshift it
                    if (isFirstPage && !existsAnywhere) {
                        return { ...p, messages: [message, ...(p.messages || [])] };
                    }

                    return p;
                });

                return { ...old, pages };
            }
            return old;
        });
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
                    isBlocked: updatedData.isBlocked ?? contact.isBlocked,
                    blockedBy: updatedData.blockedBy ?? contact.blockedBy,
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
 * Updates dynamic fields (unread count, last message, timestamps) in all 'contacts' queries.
 * Supports both paginated and flat-array cache structures via matching predicate.
 */
export const updateContactFieldsInCache = (queryClient: QueryClient, updater: (contact: any) => any) => {
    queryClient.setQueriesData({ queryKey: ['contacts'] }, (oldData: any) => {
        if (!oldData) return oldData;

        // Handle paginated queries
        if (oldData.pages) {
            return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                    ...page,
                    contacts: page.contacts?.map(updater),
                })),
            };
        }

        // Handle non-paginated array queries
        if (Array.isArray(oldData)) {
            return oldData.map(updater);
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

/**
 * Inserts a brand new contact/group conversation at the top of the 'contacts' queries.
 */
export const unshiftContactInCache = (queryClient: QueryClient, newContact: any) => {
    queryClient.setQueriesData({ queryKey: ['contacts'] }, (oldData: any) => {
        if (!oldData) return oldData;

        // Prevent duplicate insertions
        const exists = (c: any) => String(c.conversationId) === String(newContact.conversationId);

        // Handle paginated queries (insert at top of first page)
        if (oldData.pages && oldData.pages.length > 0) {
            const alreadyExists = oldData.pages.some((p: any) => p.contacts?.some(exists));
            if (alreadyExists) return oldData;

            const newPages = [...oldData.pages];
            newPages[0] = {
                ...newPages[0],
                contacts: [newContact, ...(newPages[0].contacts || [])],
            };
            return { ...oldData, pages: newPages };
        }

        // Handle non-paginated array queries
        if (Array.isArray(oldData)) {
            if (oldData.some(exists)) return oldData;
            return [newContact, ...oldData];
        }

        return oldData;
    });
};
