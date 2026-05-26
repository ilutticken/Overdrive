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

// Socket tracking for presence and disconnects
const socketMap = new Map();

// Prepared DB statements for speed
const getRoomStmt = db.prepare('SELECT * FROM rooms WHERE room_code = ?');
const updateRoomStateStmt = db.prepare('UPDATE rooms SET state = ? WHERE room_code = ?');
const insertRoomStmt = db.prepare('INSERT INTO rooms (room_code) VALUES (?)');
const getCharactersStmt = db.prepare('SELECT * FROM characters WHERE room_code = ?');
const updateCharacterPresenceStmt = db.prepare('UPDATE characters SET is_online = ? WHERE room_code = ? AND device_token = ?');
const upsertCharacterStmt = db.prepare(`
  INSERT INTO characters (room_code, device_token, name, meat, mind, moxie, is_online) 
  VALUES (@room_code, @device_token, @name, @meat, @mind, @moxie, 1)
  ON CONFLICT(room_code, device_token) DO UPDATE SET 
    name = excluded.name,
    meat = excluded.meat,
    mind = excluded.mind,
    moxie = excluded.moxie,
    is_online = 1
`);

// Player (persistent) prepared statements
const getPlayerStmt = db.prepare('SELECT * FROM players WHERE device_token = ?');
const upsertPlayerStmt = db.prepare(`
  INSERT INTO players (device_token, name, meat, mind, moxie, health, max_health, credits, gear, status_effects, notes)
  VALUES (@device_token, @name, @meat, @mind, @moxie, @health, @max_health, @credits, @gear, @status_effects, @notes)
  ON CONFLICT(device_token) DO UPDATE SET
    name = excluded.name,
    meat = excluded.meat,
    mind = excluded.mind,
    moxie = excluded.moxie,
    health = excluded.health,
    max_health = excluded.max_health,
    credits = excluded.credits,
    gear = excluded.gear,
    status_effects = excluded.status_effects,
    notes = excluded.notes,
    updated_at = CURRENT_TIMESTAMP
`);
const updatePlayerStmt = db.prepare(`
  UPDATE players SET name = @name, meat = @meat, mind = @mind, moxie = @moxie, health = @health, max_health = @max_health, credits = @credits, gear = @gear, status_effects = @status_effects, notes = @notes, updated_at = CURRENT_TIMESTAMP WHERE device_token = @device_token
`);
const getProfilesStmt = db.prepare('SELECT * FROM character_profiles WHERE device_token = ? ORDER BY last_used DESC, created_at DESC');
const getProfileByIdStmt = db.prepare('SELECT * FROM character_profiles WHERE id = ?');
const insertProfileStmt = db.prepare(`
  INSERT INTO character_profiles (device_token, name, meat, mind, moxie, health, max_health, credits, gear, status_effects, notes, last_used)
  VALUES (@device_token, @name, @meat, @mind, @moxie, @health, @max_health, @credits, @gear, @status_effects, @notes, @last_used)
`);
const updateProfileLastUsedStmt = db.prepare('UPDATE character_profiles SET last_used = ? WHERE id = ?');
const deleteProfileStmt = db.prepare('DELETE FROM character_profiles WHERE id = ? AND device_token = ?');
const getCharacterStmt = db.prepare('SELECT * FROM characters WHERE room_code = ? AND device_token = ?');

// Track active minigames per room to prevent overlapping minigames
const activeMinigames = new Set();


io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. Host creates or reconnects to a room
  socket.on('host:create_room', (data, callback) => {
    let roomCode = data?.roomCode;

    // Check if reconnecting to an existing room
    if (roomCode) {
      const room = getRoomStmt.get(roomCode);
      if (room) {
        socket.join(roomCode);
        socketMap.set(socket.id, { roomCode, role: 'host' });
        
        const characters = getCharactersStmt.all(roomCode);
        if (callback) {
          callback({ success: true, roomCode, roomState: room.state, characters });
        }
        console.log(`Host reconnected to room: ${roomCode}`);
        return;
      }
    }

    // Otherwise, create a new room
    roomCode = generateRoomCode();
    try {
      insertRoomStmt.run(roomCode);
    } catch (e) {
      roomCode = generateRoomCode();
      insertRoomStmt.run(roomCode);
    }

    socket.join(roomCode);
    socketMap.set(socket.id, { roomCode, role: 'host' });
    
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
    const { roomCode, deviceToken, name, stats, isReconnect, profileId } = data || {};
    const { meat = 1, mind = 1, moxie = 1 } = stats || {};

    // Allow joining by selecting an existing profile (profileId) or supplying a name
    if (!roomCode || !deviceToken || (!name && !isReconnect && !profileId)) {
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
      // If a profileId is provided, prefer that saved profile
      let profile = null;
      if (data.profileId) {
        const saved = getProfileByIdStmt.get(data.profileId);
        if (saved) {
          profile = {
            device_token: deviceToken,
            name: saved.name,
            meat: saved.meat,
            mind: saved.mind,
            moxie: saved.moxie,
            health: saved.health,
            max_health: saved.max_health,
            credits: saved.credits,
            gear: saved.gear,
            status_effects: saved.status_effects,
            notes: saved.notes
          };
          // mark profile last_used
          try { updateProfileLastUsedStmt.run(new Date().toISOString(), saved.id); } catch (e) {}
        }
      }

      // Load or create persistent player profile if none selected
      if (!profile) {
        const existingPlayer = getPlayerStmt.get(deviceToken);
        profile = {
          device_token: deviceToken,
          name: name || (existingPlayer && existingPlayer.name) || null,
          meat: (stats && stats.meat) || (existingPlayer && existingPlayer.meat) || meat,
          mind: (stats && stats.mind) || (existingPlayer && existingPlayer.mind) || mind,
          moxie: (stats && stats.moxie) || (existingPlayer && existingPlayer.moxie) || moxie,
          health: (stats && (stats.health ?? undefined)) || (existingPlayer && existingPlayer.health) || 3,
          max_health: (stats && (stats.max_health ?? undefined)) || (existingPlayer && existingPlayer.max_health) || 3,
          credits: (stats && (stats.credits ?? undefined)) || (existingPlayer && existingPlayer.credits) || 0,
          gear: (existingPlayer && existingPlayer.gear) || '[]',
          status_effects: (existingPlayer && existingPlayer.status_effects) || '[]',
          notes: (existingPlayer && existingPlayer.notes) || ''
        };
      }

      // Upsert persistent profile (merge with incoming name/stats)
      upsertPlayerStmt.run(profile);

      if (isReconnect) {
        // Just mark as online if reconnecting silently in the room
        updateCharacterPresenceStmt.run(1, uppercaseRoomCode, deviceToken);
      } else {
        // Upsert new or updated character in room, including health/credits/gear fields where supported
        upsertCharacterStmt.run({
          room_code: uppercaseRoomCode,
          device_token: deviceToken,
          name: profile.name,
          meat: profile.meat,
          mind: profile.mind,
          moxie: profile.moxie
        });
      }

      socket.join(uppercaseRoomCode);
      socketMap.set(socket.id, { roomCode: uppercaseRoomCode, deviceToken, role: 'player' });

      // Fetch all characters to sync state
      const characters = getCharactersStmt.all(uppercaseRoomCode);
      io.to(uppercaseRoomCode).emit('room:state_update', { characters, roomState: room.state });

      if (callback) {
        const myCharacter = characters.find(c => c.device_token === deviceToken);
        // Fetch the persistent player profile and include it in the callback
        const persistent = getPlayerStmt.get(deviceToken);
        callback({ success: true, character: myCharacter, roomState: room.state, profile: persistent });
      }

      console.log(`Player ${name || deviceToken} joined room ${uppercaseRoomCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      if(callback) callback({ success: false, message: 'Database error' });
    }
  });

  // Allow clients to update their persistent profile (notes, gear, stats, credits, etc.)
  socket.on('player:update_profile', (data, callback) => {
    const { deviceToken } = data;
    if (!deviceToken) {
      if (callback) callback({ success: false, message: 'Missing deviceToken' });
      return;
    }

    try {
      const existing = getPlayerStmt.get(deviceToken);
      if (!existing) {
        // Create new player with provided fields
        upsertPlayerStmt.run({
          device_token: deviceToken,
          name: data.name || null,
          meat: data.meat || 1,
          mind: data.mind || 1,
          moxie: data.moxie || 1,
          health: data.health || 3,
          max_health: data.max_health || 3,
          credits: data.credits || 0,
          gear: data.gear || '[]',
          status_effects: data.status_effects || '[]',
          notes: data.notes || ''
        });
      } else {
        // Update existing
        updatePlayerStmt.run({
          device_token: deviceToken,
          name: data.name ?? existing.name,
          meat: data.meat ?? existing.meat,
          mind: data.mind ?? existing.mind,
          moxie: data.moxie ?? existing.moxie,
          health: data.health ?? existing.health,
          max_health: data.max_health ?? existing.max_health,
          credits: data.credits ?? existing.credits,
          gear: data.gear ?? existing.gear,
          status_effects: data.status_effects ?? existing.status_effects,
          notes: data.notes ?? existing.notes
        });
      }

      if (callback) callback({ success: true });
    } catch (e) {
      console.error('Error updating player profile', e);
      if (callback) callback({ success: false, message: 'DB error' });
    }
  });

  // List all saved character profiles for this device
  socket.on('player:list_profiles', (data, callback) => {
    const { deviceToken } = data || {};
    if (!deviceToken) return callback?.({ success: false, message: 'Missing deviceToken' });
    try {
      const profiles = getProfilesStmt.all(deviceToken);
      if (callback) callback({ success: true, profiles });
    } catch (e) {
      console.error('Error listing profiles', e);
      if (callback) callback({ success: false, message: 'DB error' });
    }
  });

  // Get a specific profile by id
  socket.on('player:get_profile', (data, callback) => {
    const { id } = data || {};
    if (!id) return callback?.({ success: false, message: 'Missing id' });
    try {
      const profile = getProfileByIdStmt.get(id);
      if (callback) callback({ success: true, profile });
    } catch (e) {
      console.error('Error getting profile', e);
      if (callback) callback({ success: false, message: 'DB error' });
    }
  });

  // Create a new persistent character profile for this device
  socket.on('player:create_profile', (data, callback) => {
    const { deviceToken, name, meat = 1, mind = 1, moxie = 1, health = 3, max_health = 3, credits = 0, gear = '[]', status_effects = '[]', notes = '' } = data || {};
    if (!deviceToken) return callback?.({ success: false, message: 'Missing deviceToken' });
    try {
      const info = insertProfileStmt.run({
        device_token: deviceToken,
        name,
        meat,
        mind,
        moxie,
        health,
        max_health,
        credits,
        gear,
        status_effects,
        notes,
        last_used: new Date().toISOString()
      });

      const id = info.lastInsertRowid;
      const created = getProfileByIdStmt.get(id);
      if (callback) callback({ success: true, profile: created, id });
    } catch (e) {
      console.error('Error creating profile', e);
      if (callback) callback({ success: false, message: 'DB error' });
    }
  });

  // Delete a saved character profile
  socket.on('player:delete_profile', (data, callback) => {
    const { deviceToken, id } = data || {};
    if (!deviceToken || !id) return callback?.({ success: false, message: 'Missing parameters' });
    try {
      const info = deleteProfileStmt.run(id, deviceToken);
      if (callback) callback({ success: true, changes: info.changes });
    } catch (e) {
      console.error('Error deleting profile', e);
      if (callback) callback({ success: false, message: 'DB error' });
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
    socketMap.set(socket.id, { roomCode: uppercaseRoomCode, role: 'gm' });
    
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
  socket.on('gm:start_minigame', (data, callback) => {
    const { roomCode, targetDeviceToken, minigameType } = data || {};
    if (!roomCode || !targetDeviceToken) {
      if (callback) callback({ success: false, message: 'Missing parameters' });
      return;
    }

    const uppercaseRoomCode = roomCode.toUpperCase();

    // Prevent starting if a minigame is already active in this room
    if (activeMinigames.has(uppercaseRoomCode)) {
      if (callback) callback({ success: false, message: 'A minigame is already active in this room' });
      return;
    }

    // Ensure target character exists and is online
    try {
      const targetChar = getCharacterStmt.get(uppercaseRoomCode, targetDeviceToken);
      if (!targetChar || targetChar.is_online === 0) {
        if (callback) callback({ success: false, message: 'Target player is not online or not in room' });
        return;
      }
    } catch (e) {
      console.error('Error checking target character', e);
      if (callback) callback({ success: false, message: 'DB error' });
      return;
    }

    console.log(`Minigame ${minigameType} warning triggered for ${targetDeviceToken} in room ${uppercaseRoomCode}`);

    // Mark minigame active for this room
    activeMinigames.add(uppercaseRoomCode);

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

    if (callback) callback({ success: true });
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
    // Clear active minigame state for this room
    try { activeMinigames.delete(uppercaseRoomCode); } catch (e) {}
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const socketInfo = socketMap.get(socket.id);
    if (socketInfo) {
      if (socketInfo.role === 'player') {
        try {
          updateCharacterPresenceStmt.run(0, socketInfo.roomCode, socketInfo.deviceToken);
          const room = getRoomStmt.get(socketInfo.roomCode);
          if (room) {
             const characters = getCharactersStmt.all(socketInfo.roomCode);
             io.to(socketInfo.roomCode).emit('room:state_update', { characters, roomState: room.state });
          }
          console.log(`Player ${socketInfo.deviceToken} marked offline in room ${socketInfo.roomCode}`);
        } catch (e) {
          console.error('Error updating disconnect presence', e);
        }
      }
      socketMap.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Overdrive Server running on port ${PORT}`);
});
