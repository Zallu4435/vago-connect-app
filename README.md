# Vago Connect 🚀

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

> **Real-time messaging made magical.**  
> Vago Connect is a premium, full-stack social communication platform designed for seamless, real-time interaction. It combines modern web speeds with a specialized "Ancient/Magic" aesthetic to provide a unique user experience.

---

## 📖 Description

Vago Connect is more than just a chat app; it's a comprehensive communication suite. Built for developers, teams, and friends who value speed and rich media interaction, it offers a secure environment for instant messaging and peer-to-peer calling. 

What makes it unique? Its focus on **visual excellence** and **responsive architecture**, ensuring a premium feel across all devices—from mobile scrolls to desktop dashboards.

---

## 🚀 Features

- **💬 Real-time Messaging**: Instant text delivery with typing indicators and read receipts.
- **👥 Group Dynamics**: Create, manage, and interact within collaborative groups.
- **📹 HD Video & Audio Calls**: Crystal-clear P2P calling powered by ZegoCloud (WebRTC).
- **🎤 Instant Voice Notes**: Record and send audio with real-time waveform visualization.
- **📁 Multimedia Sharing**: Seamlessly exchange images, videos, and documents via Cloudinary.
- **🟢 Live Status**: Real-time tracking of who's online or when they were last seen.
- **🛡️ Secure Auth**: Dual-layer authentication using Firebase OAuth (Google) and custom JWT Access/Refresh tokens.
- **🎭 Premium UI**: Modern glassmorphism, smooth animations, and a responsive layout built with Tailwind CSS.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | [Next.js 15](https://nextjs.org/), React 19, Tailwind CSS, Zustand |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL, Prisma ORM |
| **Real-time** | Socket.io |
| **Media/Calls** | Cloudinary (Storage), ZegoCloud (WebRTC) |
| **Auth** | Firebase Auth + JWT |
| **Testing** | npm scripts for Prisma/DB validation |

---

## 📂 Project Structure

```text
vago-connect-app/
├── client/                 # Next.js Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Chat, UI, Common)
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── stores/         # Zustand State Management
│   │   └── utils/          # Helpers & Config
│   └── public/             # Static Assets
├── server/                 # Node.js/Express Backend
│   ├── controllers/        # Request Handlers
│   ├── services/           # Business Logic
│   ├── socket/             # Socket.IO Event Handlers
│   ├── prisma/             # DB Schema & Migrations
│   └── utils/              # Middlewares & Helpers
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (e.g., Neon DB)
- Cloudinary & ZegoCloud account credentials

### 1. Clone & Install
```bash
git clone https://github.com/Zallu4435/vago-connect-app.git
cd vago-connect-app

# Install Client
cd client && npm install

# Install Server
cd ../server && npm install
```

### 2. Environment Variables
Create a `.env` file in **both** the `/client` and `/server` directories based on the examples below.

### 3. Database Initialization
```bash
cd server
npm run build     # Generates Prisma Client
npm run migrate   # Applies DB schema
```

### 4. Run Locally
```bash
# In /server
npm run dev

# In /client
npm run dev
```

---

## 🔑 Environment Variables Example

### Client (`/client/.env`)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_API_URL=http://localhost:3005
NEXT_PUBLIC_SOCKET_URL=http://localhost:3005
NEXT_PUBLIC_ZEGO_APP_ID=your_zego_id
NEXT_PUBLIC_ZEGO_SERVER_SECRET=your_zego_secret
```

### Server (`/server/.env`)
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
PORT=3005
CORS_ORIGIN=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

JWT_ACCESS_SECRET=your_long_random_string
JWT_REFRESH_SECRET=your_another_long_random_string
```

---

## ▶️ Usage

1. **Sign In**: Use Google Authentication to create your account.
2. **Onboarding**: Set up your display name, about, and profile picture.
3. **Start Chatting**: Search for users in the contact list to start a private chat.
4. **Group Chat**: Click the (+) icon in the chat list to create a multi-user group.
5. **Call**: Open a chat and click the Camera or Phone icon to start a WebRTC call.

---

## 🌍 Deployment

### Backend
Deploy the `server` folder to platforms like **Render**, **Railway**, or **Fly.io**. Use the following scripts:
- **Build**: `npm run build`
- **Start**: `npm run start:prod`

### Frontend
Deploy the `client` folder to **Vercel** or **Netlify**. Ensure all `NEXT_PUBLIC_` environment variables are added to the platform's dashboard.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn and create.
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact

**Developer Name**  
- GitHub: [@Zallu4435](https://github.com/Zallu4435)  
- LinkedIn: [Your Profile](https://linkedin.com/in/your-profile)  
- Email: [your-email@example.com](mailto:your-email@example.com)

Project Link: [https://github.com/Zallu4435/vago-connect-app](https://github.com/Zallu4435/vago-connect-app)
