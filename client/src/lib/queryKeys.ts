export const queryKeys = {
  contacts: {
    all: ['contacts', 'all'] as const,
    byUser: (userId: string | number) => ['contacts', String(userId)] as const,
  },
  messages: {
    byChat: (userId: string | number, chatUserId: string | number) => ['messages', String(userId), String(chatUserId)] as const,
  },
  user: {
    byEmail: (email: string) => ['user', email] as const,
  },
  messageSearch: {
    all: ['messageSearch'] as const,
    byChat: (chatId: string | number) => ['messageSearch', String(chatId)] as const,
  },
} as const;
