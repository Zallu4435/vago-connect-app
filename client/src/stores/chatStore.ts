import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Contact, Message, User } from "../types";

interface ChatState {
  userContacts: Contact[];
  filteredContacts: Contact[];
  contactsSearch: string;
  currentChatUser: User | null;
  messages: Message[];
  messageSearch: boolean;
  onlineUsers: number[];
  allContactsPage: boolean;

  setUserContacts: (contacts: Contact[]) => void;
  setFilteredContacts: (contacts: Contact[]) => void;
  setContactsSearch: (search: string) => void;
  setCurrentChatUser: (user: User | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  toggleMessageSearch: () => void;
  setOnlineUsers: (users: number[]) => void;
  clearChat: () => void;
  setAllContactsPage: (value: boolean) => void;
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

      setUserContacts: (contacts) => set({ userContacts: contacts }),
      setFilteredContacts: (contacts) => set({ filteredContacts: contacts }),
      setContactsSearch: (search) => set({ contactsSearch: search }),
      setCurrentChatUser: (user) => set({ currentChatUser: user }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      toggleMessageSearch: () => set((state) => ({ messageSearch: !state.messageSearch })),
      setOnlineUsers: (users) => set({ onlineUsers: users }),
      clearChat: () =>
        set({ messages: [], currentChatUser: null, messageSearch: false }),
      setAllContactsPage: (value) => set({ allContactsPage: value }),
    }),
    { name: "chat-store" }
  )
);

