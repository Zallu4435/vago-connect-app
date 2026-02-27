import { useEffect, useRef } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useChatStore } from '@/stores/chatStore';
import { useQueryClient } from '@tanstack/react-query';
import { createSocketQuerySync } from '@/lib/socketQuerySync';
import { upsertMessageInCache, updateContactProfileInCache, updateGroupProfileInCache, updateContactFieldsInCache } from '@/lib/cacheHelpers';
import type { Message } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/lib/toast';
import { Logger } from '@/utils/logger';
import { normalizeMessage } from '@/utils/messageHelpers';

export function useMessageSocketHandlers() {
  const socket = useSocketStore((s) => s.socket);
  // Use a ref for currentChatUser to avoid stale closures in event handlers
  // This is the CRITICAL fix: closures inside useEffect capture the value at attachment
  // time, not at call time. Using a ref ensures we always read the latest value.
  const currentChatUserRef = useRef(useChatStore.getState().currentChatUser);
  const addMessage = useChatStore((s) => s.addMessage);
  const authUserId = useAuthStore((s) => s.userInfo?.id);
  const authUserIdRef = useRef(authUserId);

  const qc = useQueryClient();

  // Keep refs in sync with latest state without re-creating handlers
  useEffect(() => {
    // Plain Zustand subscribe — always reads all state updates
    const unsub = useChatStore.subscribe((state) => {
      currentChatUserRef.current = state.currentChatUser;
    });
    return unsub;
  }, []);


  useEffect(() => {
    authUserIdRef.current = authUserId;
  }, [authUserId]);

  // Keep addMessage ref stable
  const addMessageRef = useRef(addMessage);
  useEffect(() => {
    addMessageRef.current = addMessage;
  }, [addMessage]);

  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const socketSync = createSocketQuerySync(qc);

    const onStatusUpdate = ({ messageId, status, conversationId }: any) => {
      Logger.debug(`Socket: message-status-update for ${messageId}`, { status, conversationId });
      socketSync.onMessageStatusUpdate(messageId, status, conversationId);
    };
    const onMessagesRead = ({ messageIds, conversationId }: any) => {
      Logger.debug(`Socket: messages-read for convo ${conversationId}`, { messageIds });
      if (Array.isArray(messageIds)) {
        socketSync.onMessagesRead(messageIds, conversationId, String(authUserIdRef.current));
      }
    };
    const onEdited = ({ messageId, newContent, editedAt }: any) => {
      socketSync.onMessageEdited(messageId, newContent, editedAt);
    };
    const onDeleted = (data: any) => {
      const mid = data?.messageId || data?.id;
      const { deleteType, deletedBy } = data;
      Logger.debug(`Socket: message-deleted ${mid}`, { deleteType });

      // Update React Query Cache
      socketSync.onMessageDeleted(mid, deleteType, { deletedBy });

      // CRITICAL: Also update the Zustand store to prevent stale data overriding the cache
      const currentMsgs = useChatStore.getState().messages || [];
      const updatedMsgs = currentMsgs.map(m => {
        if (String(m.id) !== String(mid)) return m;
        if (deleteType === 'forEveryone') return { ...m, content: 'This message was deleted', isDeletedForEveryone: true };
        return { ...m, deletedBy: deletedBy || [] };
      });
      useChatStore.getState().setMessages(updatedMsgs);
    };
    const onReacted = ({ messageId, reactions }: any) => {
      socketSync.onMessageReacted(messageId, reactions || []);
    };
    const onStarred = ({ messageId, starred }: any) => {
      socketSync.onMessageStarred(messageId, starred, String(authUserIdRef.current || ''));
    };
    const onChatPinned = ({ conversationId, pinned, pinOrder }: any) => {
      socketSync.onChatPinned(conversationId, pinned, pinOrder);
    };
    const onChatCleared = ({ conversationId, clearedAt }: any) => {
      Logger.info(`Socket: chat-cleared for convo ${conversationId}`, { clearedAt });
      socketSync.onChatCleared(conversationId, clearedAt);
    };
    const onChatArchived = ({ conversationId, archived }: any) => {
      socketSync.onChatArchived(conversationId, archived);
    };
    const onChatMuted = ({ conversationId, muted, mutedUntil }: any) => {
      socketSync.onChatMuted(conversationId, muted, mutedUntil);
    };
    const onChatDeleted = ({ conversationId }: any) => {
      Logger.info(`Socket: chat-deleted for convo ${conversationId}`);
      socketSync.onChatDeleted(conversationId);

      // CRITICAL: Handle real-time closure of the deleted chat
      const current = useChatStore.getState().currentChatUser;
      if (current && (String(current.id) === String(conversationId) || String((current as any).conversationId) === String(conversationId))) {
        useChatStore.getState().setCurrentChatUser(null);
        showToast.info("This chat was deleted");
      }
    };
    const onForwarded = (payload: any) => {
      socketSync.onMessageForwarded(payload);
    };

    const updateCurrentChatBlockStatus = (userId: string | number, blocked: boolean, isBy: boolean) => {
      const current = useChatStore.getState().currentChatUser;
      if (current && String(current.id) === String(userId)) {
        useChatStore.getState().setCurrentChatUser({
          ...current,
          ...(isBy ? { blockedBy: blocked } : { isBlocked: blocked })
        });
      }
    };

    const onContactBlocked = ({ userId }: any) => {
      socketSync.onContactBlocked(userId, 'blocked');
      updateCurrentChatBlockStatus(userId, true, false);
    };
    const onContactBlockedBy = ({ userId }: any) => {
      socketSync.onContactBlocked(userId, 'blockedBy');
      updateCurrentChatBlockStatus(userId, true, true);
    };
    const onContactUnblocked = ({ userId }: any) => {
      socketSync.onContactUnblocked(userId, 'blocked');
      updateCurrentChatBlockStatus(userId, false, false);
    };
    const onContactUnblockedBy = ({ userId }: any) => {
      socketSync.onContactUnblocked(userId, 'blockedBy');
      updateCurrentChatBlockStatus(userId, false, true);
    };
    const onMessageError = (data: any) => {
      const { tempId, error } = data;
      if (tempId) {
        socketSync.onMessageStatusUpdate(tempId, 'error');
        const currentMsgs = useChatStore.getState().messages;
        useChatStore.getState().setMessages(
          (currentMsgs || []).map(m => String(m.id) === String(tempId) ? { ...m, messageStatus: 'error' } : m)
        );
      }
      showToast.error(error || "An error occurred");
      console.error("Socket error:", error);
    };

    const onGroupUpdated = ({ conversation }: any) => {
      if (!conversation?.id) return;
      const current = useChatStore.getState().currentChatUser;
      if (current && (current.id === conversation.id || (current as any).conversationId === conversation.id)) {
        useChatStore.getState().setCurrentChatUser({
          ...current,
          name: conversation.groupName,
          description: conversation.groupDescription,
          profilePicture: conversation.groupIcon,
          image: conversation.groupIcon,
          groupName: conversation.groupName,
          groupDescription: conversation.groupDescription,
          groupIcon: conversation.groupIcon,
        } as any);
      }
      updateGroupProfileInCache(qc, conversation.id, conversation);
    };

    const onGroupCreated = (payload: any) => {
      if (payload?.conversation) {
        socketSync.onGroupCreated(payload.conversation);
      }
    };

    const onGroupMembersUpdated = ({ conversationId, participants }: any) => {
      if (!conversationId || !participants) return;
      const current = useChatStore.getState().currentChatUser;
      if (current && (current.id === conversationId || (current as any).conversationId === conversationId)) {
        useChatStore.getState().setCurrentChatUser({
          ...current,
          participants
        } as any);
      }
      socketSync.onGroupMembersUpdated(conversationId, participants);
    };

    const onGroupRoleUpdated = ({ conversationId, userId, role }: any) => {
      if (!conversationId || !userId || !role) return;
      const current = useChatStore.getState().currentChatUser;
      if (current && (current.id === conversationId || (current as any).conversationId === conversationId)) {
        const updatedParticipants = (current as any).participants?.map((p: any) =>
          String(p.userId) === String(userId) ? { ...p, role } : p
        );
        useChatStore.getState().setCurrentChatUser({
          ...current,
          participants: updatedParticipants
        } as any);
      }
      socketSync.onGroupRoleUpdated(conversationId, userId, role);
    };

    const onGroupLeft = ({ conversationId, userId, leftAt }: any) => {
      if (!conversationId) return;
      const myAuthId = authUserIdRef.current;
      const current = useChatStore.getState().currentChatUser;

      if (current && (current.id === conversationId || (current as any).conversationId === conversationId)) {
        const isMe = String(userId) === String(myAuthId);
        const updatedParticipants = (current as any).participants?.map((p: any) =>
          String(p.userId) === String(userId) ? { ...p, leftAt } : p
        );
        useChatStore.getState().setCurrentChatUser({
          ...current,
          participants: updatedParticipants,
          ...(isMe ? { leftAt } : {})
        } as any);
      }
      socketSync.onGroupLeft(conversationId, userId, leftAt, String(myAuthId || ''));
    };

    const onProfileUpdated = ({ user }: any) => {
      if (!user?.id) return;
      const current = useChatStore.getState().currentChatUser;
      if (current && current.id === user.id && !(current as any).conversationId) {
        useChatStore.getState().setCurrentChatUser({
          ...current,
          name: user.name,
          about: user.about,
          profilePicture: user.profileImage || user.image,
          image: user.profileImage || user.image,
        } as any);
      }
      const authStore = useAuthStore.getState();
      if (authStore.userInfo?.id === user.id) {
        authStore.setUserInfo({ ...authStore.userInfo, ...user } as any);
      }
      updateContactProfileInCache(qc, user.id, user);
    };

    // ── message-sent: full DB-persisted message (own sent, incoming, call records) ──
    const onMessageSent = (data: any) => {
      const message: Message = data?.message || data;
      if (!message?.id) return;
      Logger.debug(`Socket: message-sent (new message) ${message.id}`, { conversationId: (message as any).conversationId });

      // Always read from refs to get the latest values (no stale closure)
      const myAuthId = authUserIdRef.current;
      const currentChatUser = currentChatUserRef.current;

      // Real-time status for incoming
      if (Number(message.senderId) !== Number(myAuthId)) {
        const isGroup = (currentChatUser as any)?.isGroup || (currentChatUser as any)?.type === 'group';
        const activeConvId = (currentChatUser as any)?.conversationId || currentChatUser?.id;
        const msgConvId = (message as any)?.conversationId;

        const isActiveChat = Boolean(currentChatUser?.id) && (
          isGroup
            ? String(activeConvId) === String(msgConvId)
            : ((String(message.senderId) === String(currentChatUser?.id) && String(message.receiverId) === String(myAuthId)) ||
              (String(message.senderId) === String(myAuthId) && String(message.receiverId) === String(currentChatUser?.id)))
        );

        if (isActiveChat) {
          s.emit('mark-read', { messageId: message.id, senderId: message.senderId });
          socketSync.onMessageStatusUpdate(message.id, 'read');
        } else {
          s.emit('mark-delivered', { messageId: message.id, senderId: message.senderId });
        }
      } else if (Number(message.senderId) === Number(message.receiverId)) {
        // Saved Messages: sender is receiver
        s.emit('mark-read', { messageId: message.id, senderId: message.senderId });
        socketSync.onMessageStatusUpdate(message.id, 'read');
      }

      const convId = (message as any)?.conversationId;
      // Skip if completely null/undefined, but 0 is a valid DM conversation indicator in some parts of our app
      if (convId === undefined || convId === null) return;

      // For Saved Messages (chat with self), the status should be 'read' immediately
      if (Number(message.senderId) === Number(message.receiverId)) {
        message.messageStatus = 'read';
        (message as any).status = 'read';
      }

      const tempId = (message as any)?.tempId;

      // Upsert into the cache (replaces tempId if present)
      upsertMessageInCache(qc, message, tempId);

      // Determine if this message belongs to the currently active chat
      const isMeReceiver = Number(message.receiverId) === Number(myAuthId);
      const isPeerSender = Number(message.senderId) === Number(currentChatUserRef.current?.id);
      const isMeSender = Number(message.senderId) === Number(myAuthId);
      const isPeerReceiver = Number(message.receiverId) === Number(currentChatUserRef.current?.id);

      const currentUser = currentChatUserRef.current;
      const curIsGroup = (currentUser as any)?.isGroup || (currentUser as any)?.type === 'group';

      const isDirectMatch = !curIsGroup && (
        (message.conversationId && currentUser?.conversationId && String(message.conversationId) === String(currentUser.conversationId)) ||
        ((Number(message.senderId) === Number(currentUser?.id) && Number(message.receiverId) === Number(myAuthId)) ||
          (Number(message.senderId) === Number(myAuthId) && Number(message.receiverId) === Number(currentUser?.id)))
      );
      const isGroupMatch = curIsGroup && String((currentUser as any).conversationId) === String(convId);

      if (isDirectMatch || isGroupMatch) {
        const currentMsgs = useChatStore.getState().messages || [];

        if (tempId) {
          useChatStore.getState().setMessages(
            currentMsgs.map(m => String(m.id) === String(tempId) ? message : m)
          );
        } else {
          const hasMsg = currentMsgs.some(m => String(m.id) === String(message.id));
          if (!hasMsg) {
            addMessageRef.current(message);
          }
        }
      }

      // Update the contacts preview row
      if (myAuthId) {
        updateContactFieldsInCache(qc, (c: any) => {
          const isMe = Number(message.senderId) === Number(myAuthId);
          const peerIdMatch = isMe ? String(message.receiverId) : String(message.senderId);

          const isMatch = (convId && convId !== "0" && String(c?.conversationId) === String(convId)) ||
            (String(c?.id) === peerIdMatch);

          if (!isMatch) return c;

          const activeUser = useChatStore.getState().currentChatUser;
          const activeChatId = activeUser?.id;
          const activeConvId = (activeUser as any)?.conversationId;
          const isGroupContact = (activeUser as any)?.isGroup;

          const isActiveChat = Boolean(activeChatId) && (
            isGroupContact
              ? (convId && convId !== "0" && String(activeConvId) === String(convId))
              : ((String(message.senderId) === String(activeChatId) && String(message.receiverId) === String(myAuthId)) ||
                (String(message.senderId) === String(myAuthId) && String(message.receiverId) === String(activeChatId)))
          );

          return {
            ...c,
            type: message.type,
            message: message.content || c.message,
            timestamp: message.createdAt || new Date().toISOString(),
            senderId: message.senderId,
            isSystemMessage: Boolean((message as any).isSystemMessage),
            systemMessageType: (message as any).systemMessageType || null,
            messageStatus: message.messageStatus || 'sent',
            totalUnreadMessages: !isMe && !isActiveChat
              ? (Number(c.totalUnreadMessages) || 0) + 1
              : (isActiveChat ? 0 : c.totalUnreadMessages),
          };
        });
      }
    };

    // Remove all existing handlers before re-attaching (clean slate)
    s.off('message-status-update', onStatusUpdate);
    s.off('messages-read', onMessagesRead);
    s.off('message-edited', onEdited);
    s.off('message-deleted', onDeleted);
    s.off('message-reacted', onReacted);
    s.off('message-starred', onStarred);
    s.off('message-forwarded', onForwarded);
    s.off('message-error', onMessageError);
    s.off('contact-blocked', onContactBlocked);
    s.off('contact-blocked-by', onContactBlockedBy);
    s.off('contact-unblocked', onContactUnblocked);
    s.off('contact-unblocked-by', onContactUnblockedBy);
    s.off('group-updated', onGroupUpdated);
    s.off('profile-updated', onProfileUpdated);
    s.off('chat-pinned', onChatPinned);
    s.off('chat-cleared', onChatCleared);
    s.off('chat-archived', onChatArchived);
    s.off('chat-muted', onChatMuted);
    s.off('chat-deleted', onChatDeleted);
    s.off('message-sent', onMessageSent);
    s.off('group-created', onGroupCreated);
    s.off('group-members-updated', onGroupMembersUpdated);
    s.off('group-role-updated', onGroupRoleUpdated);
    s.off('group-left', onGroupLeft);

    // Attach all fresh handlers
    s.on('message-status-update', onStatusUpdate);
    s.on('messages-read', onMessagesRead);
    s.on('message-edited', onEdited);
    s.on('message-deleted', onDeleted);
    s.on('message-reacted', onReacted);
    s.on('message-starred', onStarred);
    s.on('message-forwarded', onForwarded);
    s.on('message-error', onMessageError);
    s.on('contact-blocked', onContactBlocked);
    s.on('contact-blocked-by', onContactBlockedBy);
    s.on('contact-unblocked', onContactUnblocked);
    s.on('contact-unblocked-by', onContactUnblockedBy);
    s.on('group-updated', onGroupUpdated);
    s.on('profile-updated', onProfileUpdated);
    s.on('chat-pinned', onChatPinned);
    s.on('chat-cleared', onChatCleared);
    s.on('chat-archived', onChatArchived);
    s.on('chat-muted', onChatMuted);
    s.on('chat-deleted', onChatDeleted);
    s.on('message-sent', onMessageSent);
    s.on('group-created', onGroupCreated);
    s.on('group-members-updated', onGroupMembersUpdated);
    s.on('group-role-updated', onGroupRoleUpdated);
    s.on('group-left', onGroupLeft);

    return () => {
      s.off('message-status-update', onStatusUpdate);
      s.off('messages-read', onMessagesRead);
      s.off('message-edited', onEdited);
      s.off('message-deleted', onDeleted);
      s.off('message-reacted', onReacted);
      s.off('message-starred', onStarred);
      s.off('message-forwarded', onForwarded);
      s.off('message-error', onMessageError);
      s.off('group-updated', onGroupUpdated);
      s.off('profile-updated', onProfileUpdated);
      s.off('chat-pinned', onChatPinned);
      s.off('chat-cleared', onChatCleared);
      s.off('chat-archived', onChatArchived);
      s.off('chat-muted', onChatMuted);
      s.off('chat-deleted', onChatDeleted);
      s.off('message-sent', onMessageSent);
      s.off('contact-blocked', onContactBlocked);
      s.off('contact-blocked-by', onContactBlockedBy);
      s.off('contact-unblocked', onContactUnblocked);
      s.off('contact-unblocked-by', onContactUnblockedBy);
      s.off('group-created', onGroupCreated);
      s.off('group-members-updated', onGroupMembersUpdated);
      s.off('group-role-updated', onGroupRoleUpdated);
      s.off('group-left', onGroupLeft);
    };
    // Only depend on socket — currentChatUser is accessed via ref to prevent stale closures
    // while still allowing the handler to read the latest value at call time
  }, [socket, qc]);
}
