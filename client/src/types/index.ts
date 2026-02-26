export interface User {
  id: string | number;
  name: string;
  email: string;
  profileImage: string;
  about?: string;
  conversationId?: number;
  isGroup?: boolean;
}

export interface Contact {
  id: string | number;
  conversationId?: number;
  name: string;
  profilePicture: string;
  about?: string;
  timestamp?: string;
  lastMessage?: string;
  totalUnreadMessages?: number;
  isPinned?: boolean;
  isGroup?: boolean;
}

export type MessageStatusType = "sent" | "delivered" | "read" | "pending" | "error";

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  type: "text" | "audio" | "image" | "video" | "document" | "location";
  message: string;
  content: string;
  messageStatus: MessageStatusType;
  createdAt: string;
  timestamp: string;
  isForwarded?: boolean;
  replyToMessageId?: number | null;
  quotedMessage?: any;
  caption?: string | null;
  duration?: number | null;
  isEdited?: boolean;
  editedAt?: string | null;
  reactions?: any[];
  starredBy?: any[];
  isDeletedForEveryone?: boolean;
}

export interface Call {
  id?: number;
  from: User;
  to: User;
  callType: "audio" | "video";
  roomId?: string;
}

