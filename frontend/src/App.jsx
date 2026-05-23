import { useState } from 'react';
import JoinRoom from './components/JoinRoom';
import ChatRoom from './components/ChatRoom';
import React from 'react';
export default function App() {
  const [session, setSession] = useState(null);
  if (session) return <ChatRoom {...session} onLeave={() => setSession(null)} />;
  return <JoinRoom onJoin={setSession} />;
}