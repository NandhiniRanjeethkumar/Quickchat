import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import React from 'react'
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
          <span style={styles.headerRoom}> {room}</span>
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