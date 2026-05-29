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
  INSERT INTO characters (room_code, device_token, name, meat, mind, moxie, background, is_online) 
  VALUES (@room_code, @device_token, @name, @meat, @mind, @moxie, @background, 1)
  ON CONFLICT(room_code, device_token) DO UPDATE SET 
    name = excluded.name,
    meat = excluded.meat,
    mind = excluded.mind,
    moxie = excluded.moxie,
    background = excluded.background,
    is_online = 1
`);

// Player (persistent) prepared statements
const getPlayerStmt = db.prepare('SELECT * FROM players WHERE device_token = ?');
const upsertPlayerStmt = db.prepare(`
  INSERT INTO players (device_token, name, meat, mind, moxie, background, health, max_health, credits, gear, status_effects, notes)
  VALUES (@device_token, @name, @meat, @mind, @moxie, @background, @health, @max_health, @credits, @gear, @status_effects, @notes)
  ON CONFLICT(device_token) DO UPDATE SET
    name = excluded.name,
    meat = excluded.meat,
    mind = excluded.mind,
    moxie = excluded.moxie,
    background = excluded.background,
    health = excluded.health,
    max_health = excluded.max_health,
    credits = excluded.credits,
    gear = excluded.gear,
    status_effects = excluded.status_effects,
    notes = excluded.notes,
    updated_at = CURRENT_TIMESTAMP
`);
const updatePlayerStmt = db.prepare(`
  UPDATE players SET name = @name, meat = @meat, mind = @mind, moxie = @moxie, background = @background, health = @health, max_health = @max_health, credits = @credits, gear = @gear, status_effects = @status_effects, notes = @notes, updated_at = CURRENT_TIMESTAMP WHERE device_token = @device_token
`);
const getProfilesStmt = db.prepare('SELECT * FROM character_profiles WHERE device_token = ? ORDER BY last_used DESC, created_at DESC');
const getProfileByIdStmt = db.prepare('SELECT * FROM character_profiles WHERE id = ?');
const insertProfileStmt = db.prepare(`
  INSERT INTO character_profiles (device_token, name, meat, mind, moxie, background, health, max_health, credits, gear, status_effects, notes, last_used)
  VALUES (@device_token, @name, @meat, @mind, @moxie, @background, @health, @max_health, @credits, @gear, @status_effects, @notes, @last_used)
`);
const updateProfileLastUsedStmt = db.prepare('UPDATE character_profiles SET last_used = ? WHERE id = ?');
const deleteProfileStmt = db.prepare('DELETE FROM character_profiles WHERE id = ? AND device_token = ?');
const getCharacterStmt = db.prepare('SELECT * FROM characters WHERE room_code = ? AND device_token = ?');
const mergeCharacterRecord = (characterRecord) => {
  const p = getPlayerStmt.get(characterRecord.device_token) || {};
  return {
    ...characterRecord,
    background: p.background ?? characterRecord.background ?? '',
    health: (p.health !== undefined && p.health !== null) ? p.health : characterRecord.health,
    max_health: (p.max_health !== undefined && p.max_health !== null) ? p.max_health : characterRecord.max_health,
    credits: (p.credits !== undefined && p.credits !== null) ? p.credits : characterRecord.credits,
    gear: p.gear ?? characterRecord.gear,
    status_effects: p.status_effects ?? characterRecord.status_effects,
    notes: p.notes ?? characterRecord.notes,
    auto_lose_on_fail: p.auto_lose_on_fail ?? 0
  };
};

const MINIGAME_DIFFICULTY_MODIFIERS = {
  easy: [
    { type: 'time', label: 'SLOW BURN', description: 'The timer lasts longer.', durationMultiplier: 1.25 },
    { type: 'consequence', label: 'LESSER CONSEQUENCE', description: 'The GM may apply a lesser consequence.', failurePenalty: 0 },
    { type: 'target', label: 'STEADY HAND', description: 'The target stays steadier under pressure.' }
  ],
  hard: [
    { type: 'time', label: 'DEADLINE', description: 'The timer cuts down sharply.', durationMultiplier: 0.6 },
    { type: 'consequence', label: 'GREATER CONSEQUENCE', description: 'The GM may apply a greater consequence.', failurePenalty: 0 },
    { type: 'target', label: 'LOCKED ON', description: 'The target is pinned under severe pressure.' }
  ]
};

const rollMinigameModifier = (difficultyTier = 'medium') => {
  if (difficultyTier === 'medium') return null;
  const pool = MINIGAME_DIFFICULTY_MODIFIERS[difficultyTier] || [];
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Track active minigames per room to prevent overlapping minigames
const activeMinigames = new Map();
const activeFlashDraws = new Map();
const activeCombatQueues = new Map();
const activeDossiers = new Map();
// Clocks: Map<roomCode, Clock[]>
// Clock shape: { id, name, type, segments, filled, visible }
const activeClocks = new Map();
let clockIdCounter = 1;
const updatePlayerHealthStmt = db.prepare('UPDATE players SET health = ? WHERE device_token = ?');
const updateCharacterHealthStmt = db.prepare('UPDATE characters SET health = ? WHERE room_code = ? AND device_token = ?');
const setPlayerAutoLoseStmt = db.prepare('UPDATE players SET auto_lose_on_fail = ? WHERE device_token = ?');


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
          const merged = characters.map(mergeCharacterRecord);
          if (callback) {
            callback({ success: true, roomCode, roomState: room.state, characters: merged });
          }
          const gmOnline = Array.from(socketMap.values()).some(s => s.roomCode === roomCode && s.role === 'gm');
          socket.emit('room:gm_presence', { gmOnline });
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
    const { roomCode, deviceToken, name, stats, isReconnect, profileId, background } = data || {};
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
            background: saved.background || background || '',
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
          background: background || (existingPlayer && existingPlayer.background) || '',
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
          moxie: profile.moxie,
          background: profile.background || ''
        });
      }

      socket.join(uppercaseRoomCode);
      socketMap.set(socket.id, { roomCode: uppercaseRoomCode, deviceToken, role: 'player' });

      // Fetch all characters to sync state
      const characters = getCharactersStmt.all(uppercaseRoomCode);
      const merged = characters.map(mergeCharacterRecord);
      io.to(uppercaseRoomCode).emit('room:state_update', { characters: merged, roomState: room.state });

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
          background: data.background || '',
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
          background: data.background ?? existing.background,
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
    const { deviceToken, name, meat = 1, mind = 1, moxie = 1, background = '', health = 3, max_health = 3, credits = 0, gear = '[]', status_effects = '[]', notes = '' } = data || {};
    if (!deviceToken) return callback?.({ success: false, message: 'Missing deviceToken' });
    try {
      const info = insertProfileStmt.run({
        device_token: deviceToken,
        name,
        meat,
        mind,
        moxie,
        background,
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

  // Player sets auto-lose-on-fail preference
  socket.on('gm:set_auto_lose', (data, callback) => {
    const { roomCode, deviceToken, enabled } = data || {};
    if (!roomCode || !deviceToken) return callback?.({ success: false, message: 'Missing parameters' });
    const uppercaseRoomCode = roomCode.toUpperCase();
    try {
      setPlayerAutoLoseStmt.run(enabled ? 1 : 0, deviceToken);
      const characters = getCharactersStmt.all(uppercaseRoomCode);
      const merged = characters.map(mergeCharacterRecord);
      io.to(uppercaseRoomCode).emit('room:state_update', { characters: merged, roomState: getRoomStmt.get(uppercaseRoomCode).state });
      if (callback) callback({ success: true });
    } catch (e) {
      console.error('Error setting auto lose flag (GM)', e);
      if (callback) callback({ success: false, message: 'DB error' });
    }
  });

  // GM sets a player's health directly (clamped 0..max)
  socket.on('gm:set_player_health', (data, callback) => {
    const { roomCode, deviceToken, newHealth } = data || {};
    if (!roomCode || !deviceToken || typeof newHealth !== 'number') return callback?.({ success: false, message: 'Missing parameters' });
    const uppercaseRoomCode = roomCode.toUpperCase();
    try {
      const player = getPlayerStmt.get(deviceToken);
      if (!player) return callback?.({ success: false, message: 'Player not found' });
      const clamped = Math.max(0, Math.min(newHealth, player.max_health || 3));
      updatePlayerHealthStmt.run(clamped, deviceToken);
      updateCharacterHealthStmt.run(clamped, uppercaseRoomCode, deviceToken);
      const characters = getCharactersStmt.all(uppercaseRoomCode);
      io.to(uppercaseRoomCode).emit('room:state_update', { characters, roomState: getRoomStmt.get(uppercaseRoomCode).state });
      if (callback) callback({ success: true });
    } catch (e) {
      console.error('Error setting player health', e);
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
    const merged = characters.map(mergeCharacterRecord);

    if (callback) {
      callback({ success: true, characters: merged, roomState: room.state });
    }
    io.to(uppercaseRoomCode).emit('room:gm_presence', { gmOnline: true });
    console.log(`GM joined room ${uppercaseRoomCode}`);
  });

  // 4. GM Sets Room State
  socket.on('gm:set_state', (data, callback) => {
    const { roomCode, newState } = data;
    if (!roomCode || !newState) return;
    
    const uppercaseRoomCode = roomCode.toUpperCase();
    updateRoomStateStmt.run(newState, uppercaseRoomCode);
    
    const characters = getCharactersStmt.all(uppercaseRoomCode);
    const merged = characters.map(mergeCharacterRecord);
    io.to(uppercaseRoomCode).emit('room:state_update', { characters: merged, roomState: newState });
    
    if (callback) callback({ success: true });
    console.log(`Room ${uppercaseRoomCode} state changed to ${newState}`);
  });

  // 5. Minigame Flow
  socket.on('gm:start_minigame', (data, callback) => {
    const { roomCode, targetDeviceToken, minigameType, difficultyTier, position, effect } = data || {};
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

    const modifier = rollMinigameModifier(difficultyTier);
    console.log(`Minigame ${minigameType} (${difficultyTier || 'medium'}) warning triggered for ${targetDeviceToken} in room ${uppercaseRoomCode}. Modifier: ${modifier?.label || 'None'}`);

    // Mark minigame active for this room
    const resolvedPosition = position || 'risky';
    const resolvedEffect   = effect   || 'standard';

    activeMinigames.set(uppercaseRoomCode, {
      targetDeviceToken,
      minigameType,
      difficultyTier: difficultyTier || 'medium',
      modifier,
      position: resolvedPosition,
      effect:   resolvedEffect,
    });

    // 1. Emit warning immediately
    io.to(uppercaseRoomCode).emit('room:minigame_warning', {
      targetDeviceToken,
      minigameType,
      difficultyTier: difficultyTier || 'medium',
      modifier,
      position: resolvedPosition,
      effect:   resolvedEffect,
    });

    // 2. Wait 2.5 seconds, then emit actual start
    setTimeout(() => {
      io.to(uppercaseRoomCode).emit('room:minigame_started', {
        targetDeviceToken,
        minigameType,
        difficultyTier: difficultyTier || 'medium',
        modifier,
        position: resolvedPosition,
        effect:   resolvedEffect,
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
    const { roomCode, deviceToken, success, degreeOfSuccess } = data;
    if (!roomCode || !deviceToken) return;

    const uppercaseRoomCode = roomCode.toUpperCase();
    console.log(`Minigame completed for ${deviceToken} in room ${uppercaseRoomCode}. Success: ${success}, Degree: ${degreeOfSuccess}`);

    // Only process completion if a minigame was active for this room
    const activeMinigame = activeMinigames.get(uppercaseRoomCode);
    if (!activeMinigame) {
      console.log('Ignoring minigame completion: no active minigame for room', uppercaseRoomCode);
      return;
    }

    io.to(uppercaseRoomCode).emit('room:minigame_result', {
      deviceToken,
      success,
      degreeOfSuccess,
      modifier:      activeMinigame.modifier,
      difficultyTier:activeMinigame.difficultyTier,
      position:      activeMinigame.position  || 'risky',
      effect:        activeMinigame.effect    || 'standard',
    });

    // Clear active minigame state for this room
    try { activeMinigames.delete(uppercaseRoomCode); } catch (e) {}
  });

  // Dossier Minigame Flow
  socket.on('gm:start_dossier', (data, callback) => {
    const { roomCode, targetDeviceToken, disposition, motivation, fear } = data || {};
    if (!roomCode || !targetDeviceToken || disposition === undefined || !motivation || !fear) {
      if (callback) callback({ success: false, message: 'Missing parameters' });
      return;
    }
    const uppercaseRoomCode = roomCode.toUpperCase();
    
    if (activeMinigames.has(uppercaseRoomCode) || activeDossiers.has(uppercaseRoomCode)) {
      if (callback) callback({ success: false, message: 'A minigame is already active in this room' });
      return;
    }

    try {
      const targetChar = getCharacterStmt.get(uppercaseRoomCode, targetDeviceToken);
      if (!targetChar || targetChar.is_online === 0) {
        if (callback) callback({ success: false, message: 'Target player is not online or not in room' });
        return;
      }
    } catch (e) {
      if (callback) callback({ success: false, message: 'DB error' });
      return;
    }

    const motivationClues = {
      'money': 'Target has massive off-the-books gambling debts.',
      'fame': 'Target pays an agency to boost their social rating.',
      'altruism': 'Target secretly funds an undercity clinic.',
      'obedience': 'Target never takes vacation days and praises management.'
    };
    const fearClues = {
      'violence': 'Target recently hired private security escorts.',
      'ostracism': 'Target is desperate to stay in the elite corporate club.',
      'exposure': 'Target has hidden files of illegal cyber-mods.',
      'poverty': 'Target is terrified of losing their corporate housing.'
    };

    const clues = [motivationClues[motivation], fearClues[fear]].filter(Boolean);
    // Shuffle clues
    clues.sort(() => Math.random() - 0.5);

    activeDossiers.set(uppercaseRoomCode, {
      targetDeviceToken,
      disposition: Number(disposition), // 0=Unreasonable to 4=Obedient
      motivation,
      fear,
      guessedMotivation: false,
      guessedFear: false
    });

    activeMinigames.set(uppercaseRoomCode, {
      targetDeviceToken,
      minigameType: 'dossier'
    });

    io.to(uppercaseRoomCode).emit('room:dossier_started', {
      targetDeviceToken,
      disposition: Number(disposition),
      clues
    });

    if (callback) callback({ success: true });
  });

  socket.on('player:dossier_action', (data) => {
    const { roomCode, deviceToken, actionType, actionValue } = data || {};
    if (!roomCode || !deviceToken || !actionType || !actionValue) return;

    const uppercaseRoomCode = roomCode.toUpperCase();
    const dossier = activeDossiers.get(uppercaseRoomCode);
    if (!dossier || dossier.targetDeviceToken !== deviceToken) return;

    let timePenalty = 0;

    if (actionType === 'motivation') {
      if (actionValue === dossier.motivation) {
        dossier.guessedMotivation = true;
        dossier.disposition = Math.min(4, dossier.disposition + 1);
      } else {
        timePenalty = 3000; // Penalty of 3 seconds for wrong motivation
      }
    } else if (actionType === 'fear') {
      if (actionValue === dossier.fear) {
        dossier.guessedFear = true;
        dossier.disposition = Math.min(4, dossier.disposition + 1);
      } else {
        dossier.disposition -= 1; // Disposition drop for wrong fear
      }
    }

    if (dossier.disposition < 0) {
      // Failed: Dropped below Unreasonable
      io.to(uppercaseRoomCode).emit('room:minigame_result', { success: false, deviceToken, degreeOfSuccess: 'failure', finalDisposition: 0 });
      activeDossiers.delete(uppercaseRoomCode);
      activeMinigames.delete(uppercaseRoomCode);
    } else if (dossier.guessedMotivation && dossier.guessedFear) {
      // Success: Guessed both
      io.to(uppercaseRoomCode).emit('room:minigame_result', { success: true, deviceToken, degreeOfSuccess: 'success', finalDisposition: dossier.disposition });
      activeDossiers.delete(uppercaseRoomCode);
      activeMinigames.delete(uppercaseRoomCode);
    } else {
      // Continue update
      io.to(uppercaseRoomCode).emit('room:dossier_update', {
        disposition: dossier.disposition,
        guessedMotivation: dossier.guessedMotivation,
        guessedFear: dossier.guessedFear,
        timePenalty
      });
    }
  });

  socket.on('player:dossier_timeout', (data) => {
    const { roomCode, deviceToken } = data || {};
    if (!roomCode || !deviceToken) return;
    const uppercaseRoomCode = roomCode.toUpperCase();
    const dossier = activeDossiers.get(uppercaseRoomCode);
    if (dossier && dossier.targetDeviceToken === deviceToken) {
      io.to(uppercaseRoomCode).emit('room:minigame_result', { success: false, deviceToken, degreeOfSuccess: 'failure', finalDisposition: dossier.disposition });
      activeDossiers.delete(uppercaseRoomCode);
      activeMinigames.delete(uppercaseRoomCode);
    }
  });

  // Flash Draw Flow
  socket.on('gm:start_flash_draw', (data, callback) => {
    const { roomCode } = data || {};
    if (!roomCode) return callback?.({ success: false, message: 'Missing room code' });
    const uppercaseRoomCode = roomCode.toUpperCase();
    
    // Clear old state
    activeFlashDraws.delete(uppercaseRoomCode);
    
    // 1. Emit prepare (READY...)
    io.to(uppercaseRoomCode).emit('room:flash_draw_prepare');
    
    // 2. Wait random delay (2.5 to 5.5 seconds)
    const delay = Math.floor(Math.random() * 3000) + 2500;
    setTimeout(() => {
      const startTime = Date.now();
      const initialQueue = [
        { name: 'Corporate Drone', reactionTime: 500, isEnemy: true },
        { name: 'Security Guard', reactionTime: 700, isEnemy: true }
      ];
      activeFlashDraws.set(uppercaseRoomCode, { startTime, queue: initialQueue });
      io.to(uppercaseRoomCode).emit('room:flash_draw_go', { queue: initialQueue });
    }, delay);

    if (callback) callback({ success: true });
  });

  socket.on('player:flash_draw_tap', (data) => {
    const { roomCode, deviceToken, name } = data;
    if (!roomCode || !deviceToken) return;
    const uppercaseRoomCode = roomCode.toUpperCase();
    const flashDraw = activeFlashDraws.get(uppercaseRoomCode);
    if (!flashDraw) return; // Too late or not active

    // Check if player already tapped
    if (flashDraw.queue.some(entry => entry.deviceToken === deviceToken)) return;

    const reactionTime = Date.now() - flashDraw.startTime;
    flashDraw.queue.push({ name: name || 'Unknown Operative', reactionTime, isEnemy: false, deviceToken });
    
    // Sort queue by reaction time
    flashDraw.queue.sort((a, b) => a.reactionTime - b.reactionTime);
    
    io.to(uppercaseRoomCode).emit('room:flash_draw_results', { queue: flashDraw.queue });
  });

  socket.on('gm:confirm_initiative', (data, callback) => {
    const { roomCode } = data || {};
    if (!roomCode) return;
    const uppercaseRoomCode = roomCode.toUpperCase();
    const flashDraw = activeFlashDraws.get(uppercaseRoomCode);
    if (flashDraw && flashDraw.queue) {
      const combatState = { queue: flashDraw.queue, activeIndex: 0 };
      activeCombatQueues.set(uppercaseRoomCode, combatState);
      activeFlashDraws.delete(uppercaseRoomCode);
      io.to(uppercaseRoomCode).emit('room:flash_draw_complete');
      io.to(uppercaseRoomCode).emit('room:combat_queue_update', combatState);
    }
    if (callback) callback({ success: true });
  });

  socket.on('gm:next_turn', (data, callback) => {
    const { roomCode } = data || {};
    if (!roomCode) return;
    const uppercaseRoomCode = roomCode.toUpperCase();
    const combatState = activeCombatQueues.get(uppercaseRoomCode);
    if (combatState && combatState.queue && combatState.queue.length > 0) {
      combatState.activeIndex = (combatState.activeIndex + 1) % combatState.queue.length;
      io.to(uppercaseRoomCode).emit('room:combat_queue_update', combatState);
    }
    if (callback) callback({ success: true });
  });

  socket.on('gm:clear_initiative', (data, callback) => {
    const { roomCode } = data || {};
    if (!roomCode) return;
    const uppercaseRoomCode = roomCode.toUpperCase();
    activeCombatQueues.delete(uppercaseRoomCode);
    io.to(uppercaseRoomCode).emit('room:combat_queue_update', null);
    if (callback) callback({ success: true });
  });

  // ── Clocks ────────────────────────────────────────────────────────────────

  const broadcastClocks = (roomCode) => {
    const clocks = activeClocks.get(roomCode) || [];
    io.to(roomCode).emit('room:clocks_update', { clocks });
  };

  socket.on('gm:create_clock', (data, callback) => {
    const { roomCode, name, type, segments, visible } = data || {};
    if (!roomCode || !name) return callback?.({ success: false, message: 'Missing parameters' });
    const code = roomCode.toUpperCase();
    if (!activeClocks.has(code)) activeClocks.set(code, []);
    const clocks = activeClocks.get(code);
    clocks.push({ id: clockIdCounter++, name, type: type || 'threat', segments: segments || 6, filled: 0, visible: visible !== false });
    broadcastClocks(code);
    if (callback) callback({ success: true });
  });

  socket.on('gm:advance_clock', (data, callback) => {
    const { roomCode, clockId, amount } = data || {};
    if (!roomCode || !clockId) return callback?.({ success: false });
    const code = roomCode.toUpperCase();
    const clocks = activeClocks.get(code) || [];
    const clock = clocks.find(c => c.id === clockId);
    if (!clock) return callback?.({ success: false, message: 'Clock not found' });
    clock.filled = Math.max(0, Math.min(clock.segments, clock.filled + (amount || 1)));
    broadcastClocks(code);
    if (callback) callback({ success: true, filled: clock.filled, complete: clock.filled >= clock.segments });
  });

  socket.on('gm:remove_clock', (data, callback) => {
    const { roomCode, clockId } = data || {};
    if (!roomCode || !clockId) return callback?.({ success: false });
    const code = roomCode.toUpperCase();
    const clocks = activeClocks.get(code) || [];
    activeClocks.set(code, clocks.filter(c => c.id !== clockId));
    broadcastClocks(code);
    if (callback) callback({ success: true });
  });

  socket.on('gm:toggle_clock_visibility', (data, callback) => {
    const { roomCode, clockId } = data || {};
    if (!roomCode || !clockId) return callback?.({ success: false });
    const code = roomCode.toUpperCase();
    const clock = (activeClocks.get(code) || []).find(c => c.id === clockId);
    if (!clock) return callback?.({ success: false });
    clock.visible = !clock.visible;
    broadcastClocks(code);
    if (callback) callback({ success: true });
  });

  socket.on('gm:apply_glitch', (data, callback) => {
    const { roomCode, deviceToken, glitch } = data || {};
    if (!roomCode || !deviceToken || !glitch) return callback?.({ success: false });
    io.to(roomCode.toUpperCase()).emit('room:glitch_applied', { deviceToken, glitch });
    if (callback) callback({ success: true });
  });

  socket.on('gm:clear_glitches', (data, callback) => {
    const { roomCode, deviceToken } = data || {};
    if (!roomCode) return callback?.({ success: false });
    io.to(roomCode.toUpperCase()).emit('room:glitches_cleared', { deviceToken: deviceToken || null });
    if (callback) callback({ success: true });
  });

  // ── Consequence selection ─────────────────────────────────────────────────

  socket.on('player:consequence_selected', (data) => {
    const { roomCode, deviceToken, choices, degreeOfSuccess } = data || {};
    if (!roomCode || !deviceToken) return;
    const code = roomCode.toUpperCase();

    // Auto-apply health damage consequences
    choices?.forEach(choice => {
      if (choice === 'health_1') {
        try {
          const player = getPlayerStmt.get(deviceToken);
          if (player) {
            const newHp = Math.max(0, (player.health || 0) - 1);
            updatePlayerHealthStmt.run(newHp, deviceToken);
            updateCharacterHealthStmt.run(newHp, code, deviceToken);
          }
        } catch (e) { console.error('Error applying health consequence', e); }
      }
    });

    // Broadcast selection so GM and host can narrate it
    io.to(code).emit('room:consequence_selected', { deviceToken, choices, degreeOfSuccess });

    // Sync updated character state
    const characters = getCharactersStmt.all(code);
    const room = getRoomStmt.get(code);
    if (room) io.to(code).emit('room:state_update', { characters: characters.map(mergeCharacterRecord), roomState: room.state });
  });

  socket.on('gm:override_consequence', (data) => {
    const { roomCode, deviceToken } = data || {};
    if (!roomCode || !deviceToken) return;
    io.to(roomCode.toUpperCase()).emit('room:consequence_override', { deviceToken });
  });

  socket.on('player:request_clock_data', (data, callback) => {
    const { roomCode } = data || {};
    if (!roomCode) return callback?.({ success: false });
    const clocks = activeClocks.get(roomCode.toUpperCase()) || [];
    if (callback) callback({ success: true, clocks });
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
      if (socketInfo.role === 'gm') {
        const otherGmOnline = Array.from(socketMap.values()).some(s => s.roomCode === socketInfo.roomCode && s.role === 'gm' && s.id !== socket.id);
        io.to(socketInfo.roomCode).emit('room:gm_presence', { gmOnline: otherGmOnline });
      }
      socketMap.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Overdrive Server running on port ${PORT}`);
});
