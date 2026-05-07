require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const RoomManager = require('./roomManager');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const roomManager = new RoomManager();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Helper: serialize players with host flag
function serializePlayers(room) {
  return Array.from(room.players.values()).map(p => ({
    ...p,
    isHost: p.id === room.hostSocketId,
  }));
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  /* ── CREATE ROOM ── */
  socket.on('create_room', ({ roomId, playerName }) => {
    console.log(`Creating room: ${roomId} by ${playerName}`);
    const room = roomManager.createRoom(roomId);
    if (room) {
      roomManager.joinRoom(roomId, socket.id, playerName, true); // isCreator=true
      socket.join(roomId);
      console.log(`Room ${roomId} created, host: ${socket.id}`);
      socket.emit('room_created', {
        roomId,
        players: serializePlayers(room),
        isHost: true,
      });
    } else {
      socket.emit('error', 'Room already exists. Try a different ID.');
    }
  });

  /* ── JOIN ROOM ── */
  socket.on('join_room', ({ roomId, playerName }) => {
    console.log(`Joining room: ${roomId} by ${playerName}`);
    const existing = roomManager.getRoom(roomId);

    // Block entry once game has started
    if (existing && existing.gameStarted) {
      return socket.emit('error', 'Game already in progress. You cannot join now.');
    }

    const room = roomManager.joinRoom(roomId, socket.id, playerName, false);
    if (room) {
      socket.join(roomId);
      const players = serializePlayers(room);
      io.to(roomId).emit('player_joined', { players, playerName });
      socket.emit('room_joined', {
        roomId,
        players,
        calledNumbers: room.calledNumbers,
        gameStarted: room.gameStarted,
        isHost: false,
        claimedPrizes: Array.from(room.claimedPrizes),
      });
    } else {
      socket.emit('error', 'Room not found. Check the room code.');
    }
  });

  /* ── START GAME (host only) ── */
  socket.on('start_game', (roomId) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    if (room.hostSocketId !== socket.id) {
      return socket.emit('error', 'Only the host can start the game.');
    }
    room.gameStarted = true;
    room.gameState = 'playing';
    io.to(roomId).emit('game_started');
    // Auto-draw first number after 2s
    setTimeout(() => {
      const num = roomManager.drawNumber(roomId);
      if (num) io.to(roomId).emit('number_drawn', num);
    }, 2000);
  });

  /* ── DRAW NEXT (host only) ── */
  socket.on('draw_next', (roomId) => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.gameStarted) return;
    if (room.hostSocketId !== socket.id) {
      return socket.emit('error', 'Only the host can draw numbers.');
    }
    const num = roomManager.drawNumber(roomId);
    if (num) {
      io.to(roomId).emit('number_drawn', num);
    } else {
      io.to(roomId).emit('game_over', 'All 90 numbers have been drawn!');
    }
  });

  /* ── END GAME (host only) ── */
  socket.on('end_game', (roomId) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    if (room.hostSocketId !== socket.id) {
      return socket.emit('error', 'Only the host can end the game.');
    }
    // Delete room and notify all players to leave
    roomManager.deleteRoom(roomId);
    io.to(roomId).emit('room_closed');
    console.log(`Room ${roomId} closed by host.`);
  });

  /* ── CHAT ── */
  socket.on('chat_message', ({ roomId, playerName, message }) => {
    if (!message?.trim()) return;
    io.to(roomId).emit('chat_message', {
      playerName,
      message: message.trim().slice(0, 200),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on('claim', ({ roomId, claimType, ticket, playerName }) => {
    const isValid = roomManager.validateClaim(roomId, claimType, ticket);
    if (isValid) {
      io.to(roomId).emit('claim_success', { playerName, claimType });
      // Tell everyone this prize is now locked
      io.to(roomId).emit('prize_claimed', claimType);
    } else {
      const room = roomManager.getRoom(roomId);
      if (room && room.claimedPrizes.has(claimType)) {
        socket.emit('claim_failed', { claimType, message: `${claimType} has already been claimed by someone else!` });
      } else {
        socket.emit('claim_failed', { claimType, message: 'Invalid claim! Numbers don\'t match.' });
      }
    }
  });

  /* ── DISCONNECT ── */
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    roomManager.rooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        roomManager.leaveRoom(roomId, socket.id);
        // If host left, assign next player as host
        if (room.hostSocketId === socket.id && room.players.size > 0) {
          room.hostSocketId = room.players.keys().next().value;
          console.log(`Host left room ${roomId}, new host: ${room.hostSocketId}`);
        }
        io.to(roomId).emit('player_left', {
          socketId: socket.id,
          players: serializePlayers(room),
          newHostId: room.hostSocketId,
        });
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
