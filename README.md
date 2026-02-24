# Vago Connect 🚀

Vago Connect is a premium, full-stack social communication platform designed for seamless real-time interaction. It goes beyond simple messaging by offering a complete suite of communication tools, including high-definition video/audio calls, instant voice messaging, and powerful media sharing capabilities.

Built with a modern tech stack focusing on speed, reliability, and user experience.

---

## ✨ Key Features

- **💬 Real-time Messaging**: Instant text communication powered by Socket.io.
- **📹 HD Video & Audio Calls**: Seamless peer-to-peer calling powered by ZegoCloud (WebRTC).
- **🎤 Voice Notes**: Record and send audio messages with beautiful WaveSurfer visualizations.
- **📁 Multimedia Sharing**: Send images, videos, and documents effortlessly.
- **🟢 Online Presence**: Real-time user status tracking (Online/Offline).
- **🔍 Global Search**: Find contacts and messages quickly.
- **📱 Fully Responsive**: Optimized for a premium experience on both desktop and mobile devices.
- **🎭 Modern UI/UX**: Sleek, intuitive interface built with Tailwind CSS.

---

## 🛠️ Tech Stack

**Frontend:**
- **Next.js 13** (App Router & Server-side optimization)
- **Tailwind CSS** (Modern styling)
- **Zustand** (State management)
- **Wavesurfer.js** (Audio visualization)
- **Socket.io Client** (Real-time events)

**Backend:**
- **Node.js & Express** (Server architecture)
- **Socket.io** (WebSocket communication)
- **Prisma** (Database ORM)
- **Cloudinary** (Media storage/hosting)
- **ZegoCloud** (Signaling & Video infrastructure)

---

## 🚀 Getting Started

To run Vago Connect locally, follow these steps:

### Prerequisites
- Node.js installed
- PostgreSQL/MySQL database (configured for Prisma)
- Cloudinary account (for media uploads)
- ZegoCloud App credentials

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Zallu4435/vago-connect-app.git
   cd vago-connect-app
   ```

2. **Client Setup:**
   ```bash
   cd client
   npm install
   # Create a .env file and add your environmental variables
   npm run dev
   ```

3. **Server Setup:**
   ```bash
   cd server
   npm install
   # Create a .env file and add your environmental variables
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

---

## 🖇️ Environment Variables

### Client (.env)
```env
NEXT_PUBLIC_ZEGO_APP_ID=your_id
NEXT_PUBLIC_ZEGO_SERVER_SECRET=your_secret
NEXT_PUBLIC_SERVER_URL=http://localhost:3005
```

### Server (.env)
```env
DATABASE_URL=your_prisma_db_url
CLOUDINARY_URL=your_cloudinary_url
JWT_KEY=your_secret_key
PORT=3005
```

---

## 📄 License
This project is licensed under the MIT License.
