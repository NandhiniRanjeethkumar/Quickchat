import React from "react";
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