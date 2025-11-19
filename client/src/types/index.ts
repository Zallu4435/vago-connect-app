export interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  about?: string;
}

export interface Contact {
  id: string;
  name: string;
  profilePicture: string;
  about?: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  type: "text" | "audio" | "image";
  message: string;
  messageStatus: "sent" | "delivered" | "read";
  createdAt: string;
}

export interface Call {
  id?: number;
  from: User;
  to: User;
  callType: "audio" | "video";
  roomId?: string;
}

