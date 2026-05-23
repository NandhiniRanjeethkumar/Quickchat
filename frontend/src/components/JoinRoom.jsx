import { useState } from 'react';
import React from 'react';
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