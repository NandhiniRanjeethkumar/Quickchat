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
  cors: { origin: ['http://localhost:5173', 'http://localhost:5174'], methods: ['GET','POST'] }
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