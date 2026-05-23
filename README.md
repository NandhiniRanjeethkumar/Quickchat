# Quickchat
Real-time chat application 
# Project 2: Real-Time Chat Application

## Stack: React + Node.js + Express + Socket.io + MongoDB

## Folder Structure
```
chat-app/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   └── models/
│       └── Message.js
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        └── components/
            ├── ChatRoom.jsx
            ├── JoinRoom.jsx
            └── MessageBubble.jsx
```

---

## BACKEND

### backend/package.json
```json
{
  "name": "chat-app-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { "start": "node server.js", "dev": "nodemon server.js" },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": { "nodemon": "^3.0.1" }
}
```

### backend/.env
```
PORT=5002
MONGO_URI=mongodb://localhost:27017/chatappdb
```

### backend/models/Message.js
```js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room:      { type: String, required: true },
  username:  { type: String, required: true },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
```

### backend/server.js
```js
require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const mongoose  = require('mongoose');
const cors      = require('cors');
const Message   = require('./models/Message');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET','POST'] }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// REST: get last 50 messages for a room
app.get('/api/messages/:room', async (req, res) => {
  const messages = await Message.find({ room: req.params.room })
    .sort({ createdAt: -1 }).limit(50).lean();
  res.json(messages.reverse());
});

// Track online users per room
const rooms = {};

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join_room', async ({ room, username }) => {
    socket.join(room);
    socket.data = { room, username };

    if (!rooms[room]) rooms[room] = new Set();
    rooms[room].add(username);
    io.to(room).emit('online_users', Array.from(rooms[room]));

    // Notify others
    socket.to(room).emit('system_message', `${username} joined the room`);
  });

  socket.on('send_message', async ({ room, username, text }) => {
    const msg = await Message.create({ room, username, text });
    io.to(room).emit('receive_message', {
      _id: msg._id, username, text, createdAt: msg.createdAt
    });
  });

  socket.on('typing', ({ room, username }) => {
    socket.to(room).emit('user_typing', username);
  });

  socket.on('stop_typing', ({ room }) => {
    socket.to(room).emit('user_stop_typing');
  });

  socket.on('disconnect', () => {
    const { room, username } = socket.data || {};
    if (room && username && rooms[room]) {
      rooms[room].delete(username);
      io.to(room).emit('online_users', Array.from(rooms[room]));
      io.to(room).emit('system_message', `${username} left the room`);
    }
  });
});

server.listen(process.env.PORT, () => console.log(`Server on port ${process.env.PORT}`));
```

---

## FRONTEND

### frontend/package.json
```json
{
  "name": "chat-app-frontend",
  "version": "1.0.0",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.2",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "vite": "^4.4.9",
    "@vitejs/plugin-react": "^4.0.4"
  }
}
```

### frontend/src/index.css
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Nunito:wght@400;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #f0f4ff;
  --surface: #ffffff;
  --border: #e0e6f7;
  --accent: #4f46e5;
  --accent-light: #eef2ff;
  --text: #1e1b4b;
  --muted: #94a3b8;
  --bubble-mine: #4f46e5;
  --bubble-other: #ffffff;
  --online: #22c55e;
}
body { background: var(--bg); font-family: 'Nunito', sans-serif; color: var(--text); height: 100vh; overflow: hidden; }
```

### frontend/src/App.jsx
```jsx
import { useState } from 'react';
import JoinRoom from './components/JoinRoom';
import ChatRoom from './components/ChatRoom';

export default function App() {
  const [session, setSession] = useState(null);
  if (session) return <ChatRoom {...session} onLeave={() => setSession(null)} />;
  return <JoinRoom onJoin={setSession} />;
}
```

### frontend/src/components/JoinRoom.jsx
```jsx
import { useState } from 'react';

export default function JoinRoom({ onJoin }) {
  const [username, setUsername] = useState('');
  const [room, setRoom]         = useState('');
  const rooms = ['general', 'tech-talk', 'random', 'announcements'];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>💬</div>
        <h1 style={styles.title}>QuickChat</h1>
        <p style={styles.sub}>Jump into a room and start chatting</p>
        <input
          style={styles.input}
          placeholder="Your username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          maxLength={20}
        />
        <p style={styles.label}>Choose a room</p>
        <div style={styles.rooms}>
          {rooms.map(r => (
            <button
              key={r}
              style={{ ...styles.roomBtn, ...(room === r ? styles.roomBtnActive : {}) }}
              onClick={() => setRoom(r)}
            ># {r}</button>
          ))}
        </div>
        <button
          style={{ ...styles.btn, opacity: (!username.trim() || !room) ? 0.5 : 1 }}
          disabled={!username.trim() || !room}
          onClick={() => onJoin({ username: username.trim(), room })}
        >Join Room →</button>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  card: { background: '#fff', borderRadius: 20, padding: '2.5rem', width: 400, boxShadow: '0 10px 40px rgba(79,70,229,0.15)', textAlign: 'center' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 30, fontWeight: 800, color: '#1e1b4b', marginBottom: 6 },
  sub: { color: '#94a3b8', marginBottom: 24, fontSize: 15 },
  input: { width: '100%', border: '2px solid #e0e6f7', borderRadius: 12, padding: '12px 16px', fontSize: 15, outline: 'none', marginBottom: 20, color: '#1e1b4b' },
  label: { textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#4f46e5', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  rooms: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 },
  roomBtn: { background: '#f0f4ff', border: '2px solid transparent', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#475569' },
  roomBtnActive: { background: '#eef2ff', border: '2px solid #4f46e5', color: '#4f46e5' },
  btn: { width: '100%', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }
};
```

### frontend/src/components/MessageBubble.jsx
```jsx
export default function MessageBubble({ msg, isMe }) {
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
      {!isMe && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
          {msg.username?.[0]?.toUpperCase()}
        </div>
      )}
      <div style={{ maxWidth: '65%' }}>
        {!isMe && <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, fontWeight: 600 }}>{msg.username}</p>}
        <div style={{
          background: isMe ? '#4f46e5' : '#fff',
          color: isMe ? '#fff' : '#1e1b4b',
          padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          fontSize: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', lineHeight: 1.5
        }}>{msg.text}</div>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>{time}</p>
      </div>
    </div>
  );
}
```

### frontend/src/components/ChatRoom.jsx
```jsx
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import MessageBubble from './MessageBubble';

const SOCKET_URL = 'http://localhost:5002';

export default function ChatRoom({ username, room, onLeave }) {
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [typing, setTyping]       = useState('');
  const [online, setOnline]       = useState([]);
  const [system, setSystem]       = useState([]);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    // Load history
    axios.get(`${SOCKET_URL}/api/messages/${room}`)
      .then(r => setMessages(r.data));

    // Connect socket
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('join_room', { room, username });

    socket.on('receive_message', msg => setMessages(prev => [...prev, msg]));
    socket.on('online_users', users => setOnline(users));
    socket.on('user_typing', name => setTyping(`${name} is typing...`));
    socket.on('user_stop_typing', () => setTyping(''));
    socket.on('system_message', msg => setSystem(prev => [...prev, msg]));

    return () => socket.disconnect();
  }, [room, username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socketRef.current.emit('send_message', { room, username, text });
    socketRef.current.emit('stop_typing', { room });
    setText('');
  };

  const handleTyping = e => {
    setText(e.target.value);
    socketRef.current.emit('typing', { room, username });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current.emit('stop_typing', { room }), 1500);
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>💬 QuickChat</div>
        <div style={styles.roomName}># {room}</div>
        <p style={styles.sideLabel}>Online — {online.length}</p>
        {online.map(u => (
          <div key={u} style={styles.user}>
            <span style={styles.dot} /> {u}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerRoom}># {room}</span>
          <button style={styles.leaveBtn} onClick={onLeave}>Leave Room</button>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map(msg => (
            <MessageBubble key={msg._id} msg={msg} isMe={msg.username === username} />
          ))}
          {typing && <p style={styles.typing}>{typing}</p>}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            placeholder={`Message #${room}`}
            value={text}
            onChange={handleTyping}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button style={styles.sendBtn} onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', height: '100vh' },
  sidebar: { width: 220, background: '#1e1b4b', color: '#c7d2fe', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: 6 },
  logo: { fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16 },
  roomName: { background: '#312e81', borderRadius: 8, padding: '8px 12px', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 },
  sideLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#818cf8', marginBottom: 4 },
  user: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '4px 0' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f4ff' },
  header: { padding: '1rem 1.5rem', background: '#fff', borderBottom: '1px solid #e0e6f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerRoom: { fontWeight: 800, fontSize: 18, color: '#1e1b4b' },
  leaveBtn: { background: 'transparent', border: '1px solid #e0e6f7', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#64748b' },
  messages: { flex: 1, overflowY: 'auto', padding: '1.5rem' },
  typing: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginBottom: 8 },
  inputRow: { padding: '1rem 1.5rem', background: '#fff', borderTop: '1px solid #e0e6f7', display: 'flex', gap: 10 },
  input: { flex: 1, border: '2px solid #e0e6f7', borderRadius: 12, padding: '12px 16px', fontSize: 15, outline: 'none', color: '#1e1b4b' },
  sendBtn: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
};
```

---

## HOW TO RUN

### Backend
```bash
cd backend
npm install
npm run dev
# Server on http://localhost:5002
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App on http://localhost:5173
```

### Test Real-Time
Open two browser tabs or windows pointing to `http://localhost:5173` and chat between them!
