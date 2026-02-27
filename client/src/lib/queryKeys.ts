export const queryKeys = {
  contacts: {
    all: ['contacts', 'all'] as const,
    byUser: (userId: string | number) => ['contacts', String(userId)] as const,
  },
  messages: {
    byChat: (userId: string | number, chatUserId: string | number, isGroup: boolean = false) => ['messages', String(userId), String(chatUserId), isGroup ? 'group' : 'direct'] as const,
  },
  user: {
    byEmail: (email: string) => ['user', email] as const,
  },
  messageSearch: {
    all: ['messageSearch'] as const,
    byChat: (chatId: string | number, isGroup: boolean = false) => ['messageSearch', String(chatId), isGroup ? 'group' : 'direct'] as const,
  },
} as const;
