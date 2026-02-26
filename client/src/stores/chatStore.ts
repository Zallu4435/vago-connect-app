import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Contact, Message, User, MessageStatusType } from "../types";

interface ChatState {
  userContacts: Contact[];
  filteredContacts: Contact[];
  contactsSearch: string;
  currentChatUser: User | null;
  messages: Message[];
  messageSearch: boolean;
  onlineUsers: number[];
  typingUsers: number[];
  activePage: "default" | "contacts" | "profile" | "calls";
  replyTo: Message | null;
  editMessage: Message | null;

  setUserContacts: (contacts: Contact[]) => void;
  setFilteredContacts: (contacts: Contact[]) => void;
  setContactsSearch: (search: string) => void;
  setCurrentChatUser: (user: User | null) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  toggleMessageSearch: () => void;
  setOnlineUsers: (users: number[]) => void;
  addTypingUser: (userId: number) => void;
  removeTypingUser: (userId: number) => void;
  clearChat: () => void;
  setActivePage: (page: "default" | "contacts" | "profile" | "calls") => void;
  setReplyTo: (message: Message | null) => void;
  clearReplyTo: () => void;
  setEditMessage: (message: Message | null) => void;
  clearEditMessage: () => void;
  updateMessageStatus: (id: number, status: MessageStatusType) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      userContacts: [],
      filteredContacts: [],
      contactsSearch: "",
      currentChatUser: null,
      messages: [],
      messageSearch: false,
      onlineUsers: [],
      typingUsers: [],
      activePage: "default",
      replyTo: null,
      editMessage: null,

      setUserContacts: (contacts) => set({ userContacts: contacts }),
      setFilteredContacts: (contacts) => set({ filteredContacts: contacts }),
      setContactsSearch: (search) => set({ contactsSearch: search }),
      setCurrentChatUser: (user) => set({ currentChatUser: user }),
      setMessages: (messages) =>
        set((state) => ({
          messages: typeof messages === "function" ? messages(state.messages) : messages,
        })),
      addMessage: (message) => set((state) => {
        // Prevent duplicate messages (especially from optimistic updates vs socket echo)
        if (state.messages.some((m) => m.id === message.id)) {
          return state;
        }
        return { messages: [...state.messages, message] };
      }),
      toggleMessageSearch: () => set((state) => ({ messageSearch: !state.messageSearch })),
      setOnlineUsers: (users) => set({ onlineUsers: users }),
      addTypingUser: (userId) =>
        set((state) => ({
          typingUsers: state.typingUsers.includes(userId) ? state.typingUsers : [...state.typingUsers, userId]
        })),
      removeTypingUser: (userId) =>
        set((state) => ({
          typingUsers: state.typingUsers.filter((id) => id !== userId)
        })),
      clearChat: () =>
        set({ messages: [], currentChatUser: null, messageSearch: false }),
      setActivePage: (page) => set({ activePage: page }),
      setReplyTo: (message) => set({ replyTo: message }),
      clearReplyTo: () => set({ replyTo: null }),
      setEditMessage: (message) => set({ editMessage: message }),
      clearEditMessage: () => set({ editMessage: null }),
      updateMessageStatus: (id, status) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, messageStatus: status, status } : m
          ),
        })),
    }),
    { name: "chat-store" }
  )
);

