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
  allContactsPage: boolean;
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
  clearChat: () => void;
  setAllContactsPage: (value: boolean) => void;
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
      allContactsPage: false,
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
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      toggleMessageSearch: () => set((state) => ({ messageSearch: !state.messageSearch })),
      setOnlineUsers: (users) => set({ onlineUsers: users }),
      clearChat: () =>
        set({ messages: [], currentChatUser: null, messageSearch: false }),
      setAllContactsPage: (value) => set({ allContactsPage: value }),
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

