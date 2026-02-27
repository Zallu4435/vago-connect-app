import type { QueryClient } from '@tanstack/react-query';
import type { Message } from '@/types';
import { updateMessagesCache, updateContactFieldsInCache, upsertMessageInCache, updateContactProfileInCache, unshiftContactInCache } from './cacheHelpers';
import { Logger } from '@/utils/logger';

export const createSocketQuerySync = (queryClient: QueryClient) => {
  return {


    onMessageStatusUpdate: (messageId: number | string, status: string, conversationId?: number | string) => {
      updateMessagesCache(queryClient, (msg: any) =>
        String(msg?.id) === String(messageId) ? { ...msg, messageStatus: status } : msg
      );
      if (conversationId) {
        updateContactFieldsInCache(queryClient, (c: any) => {
          if (String(c.conversationId) !== String(conversationId)) return c;
          // Only update the preview status if this messageId matches the preview message
          // or if no specific preview ID exists but we want to optimistically update
          return { ...c, messageStatus: status };
        });
      }
    },

    onMessagesRead: (messageIds: (number | string)[], conversationId?: number | string, authUserId?: string) => {
      const idsSet = new Set(messageIds.map(String));
      updateMessagesCache(queryClient, (msg: any) =>
        idsSet.has(String(msg?.id)) ? { ...msg, messageStatus: 'read' } : msg
      );

      // Clear unread badge in contacts list when messages in this conversation are read
      // Also mark the preview message as read (blue ticks)
      if (conversationId && authUserId) {
        updateContactFieldsInCache(queryClient, (c: any) =>
          String(c.conversationId) === String(conversationId)
            ? { ...c, totalUnreadMessages: 0, messageStatus: 'read' }
            : c
        );
      }
    },

    onMessageEdited: (messageId: number | string, newContent: string, editedAt?: string) => {
      updateMessagesCache(queryClient, (msg: any) =>
        String(msg?.id) === String(messageId) ? { ...msg, content: newContent, isEdited: true, editedAt: editedAt || new Date().toISOString() } : msg
      );
    },

    onMessageDeleted: (messageId: number | string, deleteType: 'forMe' | 'forEveryone', payload?: any) => {
      updateMessagesCache(queryClient, (msg: any) => {
        if (String(msg?.id) !== String(messageId)) return msg;
        if (deleteType === 'forEveryone') return { ...msg, content: 'This message was deleted', isDeletedForEveryone: true };
        return { ...msg, deletedBy: payload?.deletedBy || [] };
      });
    },

    onMessageReacted: (messageId: number | string, reactions: any[]) => {
      updateMessagesCache(queryClient, (msg: any) =>
        String(msg?.id) === String(messageId) ? { ...msg, reactions } : msg
      );
    },

    onMessageStarred: (messageId: number | string, starred: boolean, userId?: number | string) => {
      updateMessagesCache(queryClient, (msg: any) => {
        if (String(msg?.id) !== String(messageId)) return msg;
        const arr = Array.isArray(msg.starredBy) ? msg.starredBy.slice() : [];
        const uid = Number(userId);
        const exists = arr.some((e: any) => (e?.userId ?? e) === uid);
        let next = arr;
        if (starred && !exists) next = [...arr, { userId: uid, starredAt: new Date().toISOString() }];
        if (!starred && exists) next = arr.filter((e: any) => (e?.userId ?? e) !== uid);
        return { ...msg, starredBy: next };
      });
    },

    onMessageForwarded: (_payload: { message: any; conversationId: number | string }) => {
      // We don't have a userId/peerId mapping for conversationId here, so simply invalidate
      // messages and contacts; the next query fetch will include forwarded items.
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },

    onUserOnline: (_userId: number | string) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },

    onUserOffline: (_userId: number | string) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },

    onChatPinned: (conversationId: number | string, pinned: boolean, pinOrder: number) => {
      updateContactFieldsInCache(queryClient, (c: any) =>
        String(c.conversationId) === String(conversationId)
          ? { ...c, isPinned: pinned, pinOrder }
          : c
      );
    },

    onChatCleared: (conversationId: number | string, clearedAt: string) => {
      Logger.info(`Sync: Clearing message cache for chat ${conversationId}`);
      // 1. Reset contact preview
      updateContactFieldsInCache(queryClient, (c: any) =>
        String(c.conversationId) === String(conversationId)
          ? { ...c, message: '', type: 'text', timestamp: clearedAt, totalUnreadMessages: 0 }
          : c
      );
      // 2. Invalidate messages for this specific chat
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },

    onChatArchived: (conversationId: number | string, archived: boolean) => {
      // Invalidate contacts to handle removal/addition to the sidebar list (Filter handles visibility)
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },

    onChatMuted: (conversationId: number | string, muted: boolean, mutedUntil?: string) => {
      updateContactFieldsInCache(queryClient, (c: any) =>
        String(c.conversationId) === String(conversationId)
          ? { ...c, isMuted: muted, mutedUntil }
          : c
      );
    },

    onChatDeleted: (conversationId: number | string) => {
      Logger.info(`Sync: Removing chat ${conversationId} from list`);
      // Remove the conversation from the contacts list in cache
      queryClient.setQueriesData({ queryKey: ['contacts'] }, (oldData: any) => {
        if (!oldData) return oldData;
        const filter = (c: any) => String(c.conversationId) !== String(conversationId);
        if (oldData.pages) {
          return {
            ...oldData,
            pages: oldData.pages.map((p: any) => ({ ...p, contacts: p.contacts?.filter(filter) })),
          };
        }
        return Array.isArray(oldData) ? oldData.filter(filter) : oldData;
      });
    },

    onContactBlocked: (userId: string | number, type: 'blocked' | 'blockedBy') => {
      updateContactProfileInCache(queryClient, userId, {
        [type === 'blocked' ? 'isBlocked' : 'blockedBy']: true
      });
    },

    onContactUnblocked: (userId: string | number, type: 'blocked' | 'blockedBy') => {
      updateContactProfileInCache(queryClient, userId, {
        [type === 'blocked' ? 'isBlocked' : 'blockedBy']: false
      });
    },

    onGroupCreated: (groupData: any) => {
      // Create a mapped contact-like object
      const newContact = {
        id: groupData.id, // For fallback matching if needed
        conversationId: groupData.id,
        name: groupData.groupName,
        email: null,
        profilePicture: groupData.groupIcon,
        about: groupData.groupDescription,
        type: 'text',
        message: 'Group created',
        timestamp: groupData.createdAt || new Date().toISOString(),
        totalUnreadMessages: 0,
        messageStatus: 'sent',
        isGroup: true,
        participants: groupData.participants || []
      };

      unshiftContactInCache(queryClient, newContact);
    },

    onGroupMembersUpdated: (conversationId: string | number, participants: any[], currentUserId?: string) => {
      updateContactFieldsInCache(queryClient, (c: any) => {
        if (String(c.conversationId) !== String(conversationId)) return c;

        const isMeInActive = currentUserId && participants.some((p: any) => String(p.userId) === String(currentUserId) && !p.leftAt);

        return {
          ...c,
          participants,
          leftAt: isMeInActive ? null : c.leftAt // Clear leftAt in sidebar if re-added
        };
      });
    },

    onGroupRoleUpdated: (conversationId: string | number, userId: string | number, role: string) => {
      updateContactFieldsInCache(queryClient, (c: any) => {
        if (String(c.conversationId) !== String(conversationId)) return c;
        const updatedParticipants = (c.participants || []).map((p: any) =>
          String(p.userId) === String(userId) ? { ...p, role } : p
        );
        return { ...c, participants: updatedParticipants };
      });
    },

    onGroupLeft: (conversationId: string | number, userId: string | number, leftAt: string, currentUserId: string) => {
      updateContactFieldsInCache(queryClient, (c: any) => {
        if (String(c.conversationId) !== String(conversationId)) return c;
        const isMe = String(userId) === String(currentUserId);
        const updatedParticipants = (c.participants || []).map((p: any) =>
          String(p.userId) === String(userId) ? { ...p, leftAt } : p
        );
        return {
          ...c,
          participants: updatedParticipants,
          ...(isMe ? { leftAt } : {})
        };
      });
    },
  };
};
