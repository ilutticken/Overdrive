const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For local dev, allow all origins
    methods: ['GET', 'POST']
  }
});

// Utility to generate a 4-letter room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Prepared DB statements for speed
const getRoomStmt = db.prepare('SELECT * FROM rooms WHERE room_code = ?');
const updateRoomStateStmt = db.prepare('UPDATE rooms SET state = ? WHERE room_code = ?');
const insertRoomStmt = db.prepare('INSERT INTO rooms (room_code) VALUES (?)');
const getCharactersStmt = db.prepare('SELECT * FROM characters WHERE room_code = ?');
const upsertCharacterStmt = db.prepare(`
  INSERT INTO characters (room_code, device_token, name, meat, mind, moxie) 
  VALUES (@room_code, @device_token, @name, @meat, @mind, @moxie)
  ON CONFLICT(room_code, device_token) DO UPDATE SET 
    name = excluded.name,
    meat = excluded.meat,
    mind = excluded.mind,
    moxie = excluded.moxie
`);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. Host creates a room
  socket.on('host:create_room', (callback) => {
    let roomCode = generateRoomCode();
    // Try to insert, if duplicate (extremely rare), just generate another one
    try {
      insertRoomStmt.run(roomCode);
    } catch (e) {
      roomCode = generateRoomCode();
      insertRoomStmt.run(roomCode);
    }

    socket.join(roomCode);
    
    if (callback) {
      callback({
        success: true,
        roomCode,
        roomState: 'lobby',
        characters: []
      });
    }
    console.log(`Host created room: ${roomCode}`);
  });

  // 2. Player joins a room
  socket.on('player:join_room', (data, callback) => {
    const { roomCode, deviceToken, name, stats } = data;
    const { meat = 1, mind = 1, moxie = 1 } = stats || {};

    if (!roomCode || !deviceToken || !name) {
      if(callback) callback({ success: false, message: 'Missing required fields' });
      return;
    }

    const uppercaseRoomCode = roomCode.toUpperCase();
    const room = getRoomStmt.get(uppercaseRoomCode);
    if (!room) {
      if(callback) callback({ success: false, message: 'Room not found' });
      return;
    }

    try {
      // Upsert the character (creates new or updates existing based on deviceToken)
      upsertCharacterStmt.run({
        room_code: uppercaseRoomCode,
        device_token: deviceToken,
        name,
        meat,
        mind,
        moxie
      });

      // Join the socket room for real-time broadcasts
      socket.join(uppercaseRoomCode);

      // Fetch all characters in the room to sync state
      const characters = getCharactersStmt.all(uppercaseRoomCode);

      // Notify everyone in the room (Host, GM, other players) that state changed
      io.to(uppercaseRoomCode).emit('room:state_update', { characters, roomState: room.state });

      if (callback) {
        // Return the specific character's data to the joining player
        const myCharacter = characters.find(c => c.device_token === deviceToken);
        callback({ success: true, character: myCharacter, roomState: room.state });
      }

      console.log(`Player ${name} joined room ${uppercaseRoomCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      if(callback) callback({ success: false, message: 'Database error' });
    }
  });

  // 3. GM Joins a room
  socket.on('gm:join_room', (data, callback) => {
    const { roomCode } = data;
    if (!roomCode) {
      if(callback) callback({ success: false, message: 'Missing room code' });
      return;
    }

    const uppercaseRoomCode = roomCode.toUpperCase();
    const room = getRoomStmt.get(uppercaseRoomCode);
    
    if (!room) {
      if(callback) callback({ success: false, message: 'Room not found' });
      return;
    }

    socket.join(uppercaseRoomCode);
    const characters = getCharactersStmt.all(uppercaseRoomCode);

    if (callback) {
      callback({ success: true, characters, roomState: room.state });
    }
    console.log(`GM joined room ${uppercaseRoomCode}`);
  });

  // 4. GM Sets Room State
  socket.on('gm:set_state', (data, callback) => {
    const { roomCode, newState } = data;
    if (!roomCode || !newState) return;
    
    const uppercaseRoomCode = roomCode.toUpperCase();
    updateRoomStateStmt.run(newState, uppercaseRoomCode);
    
    const characters = getCharactersStmt.all(uppercaseRoomCode);
    io.to(uppercaseRoomCode).emit('room:state_update', { characters, roomState: newState });
    
    if (callback) callback({ success: true });
    console.log(`Room ${uppercaseRoomCode} state changed to ${newState}`);
  });

  // 5. Minigame Flow
  socket.on('gm:start_minigame', (data) => {
    const { roomCode, targetDeviceToken, minigameType } = data;
    if (!roomCode || !targetDeviceToken) return;
    
    const uppercaseRoomCode = roomCode.toUpperCase();
    console.log(`Minigame ${minigameType} warning triggered for ${targetDeviceToken} in room ${uppercaseRoomCode}`);
    
    // 1. Emit warning immediately
    io.to(uppercaseRoomCode).emit('room:minigame_warning', {
      targetDeviceToken,
      minigameType
    });

    // 2. Wait 2.5 seconds, then emit actual start
    setTimeout(() => {
      io.to(uppercaseRoomCode).emit('room:minigame_started', {
        targetDeviceToken,
        minigameType
      });
    }, 2500);
  });

  socket.on('player:minigame_progress', (data) => {
    const { roomCode, deviceToken, progress } = data;
    if (!roomCode || !deviceToken) return;
    
    const uppercaseRoomCode = roomCode.toUpperCase();
    io.to(uppercaseRoomCode).emit('room:minigame_progress', {
      deviceToken,
      progress
    });
  });

  socket.on('player:minigame_complete', (data) => {
    const { roomCode, deviceToken, success } = data;
    if (!roomCode || !deviceToken) return;
    
    const uppercaseRoomCode = roomCode.toUpperCase();
    console.log(`Minigame completed for ${deviceToken} in room ${uppercaseRoomCode}. Success: ${success}`);
    
    io.to(uppercaseRoomCode).emit('room:minigame_result', {
      deviceToken,
      success
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Overdrive Server running on port ${PORT}`);
});
