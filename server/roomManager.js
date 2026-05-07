class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId) {
    if (this.rooms.has(roomId)) return false;
    
    const roomState = {
      id: roomId,
      players: new Map(),
      hostSocketId: null,
      calledNumbers: [],
      availableNumbers: Array.from({ length: 90 }, (_, i) => i + 1),
      gameStarted: false,
      gameState: 'waiting',
      claimedPrizes: new Set(),   // tracks which prizes have been won
      history: []
    };
    
    this.rooms.set(roomId, roomState);
    return roomState;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, socketId, playerName, isCreator = false) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    room.players.set(socketId, {
      id: socketId,
      name: playerName,
      joinedAt: new Date()
    });

    // First joiner (creator) becomes host
    if (isCreator || room.players.size === 1) {
      room.hostSocketId = socketId;
    }
    
    return room;
  }

  leaveRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.players.delete(socketId);
      if (room.players.size === 0) {
        // Optional: Keep room for a while or delete immediately
        // this.rooms.delete(roomId);
      }
    }
  }

  drawNumber(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.availableNumbers.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * room.availableNumbers.length);
    const number = room.availableNumbers.splice(randomIndex, 1)[0];
    room.calledNumbers.push(number);
    
    return number;
  }

  validateClaim(roomId, claimType, ticket) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Prize already claimed by someone else
    if (room.claimedPrizes.has(claimType)) return false;

    const called = new Set(room.calledNumbers);
    let valid = false;
    
    switch (claimType) {
      case 'jaldi5':    valid = this.checkEarly5(ticket, called);  break;
      case 'topRow':    valid = this.checkRow(ticket[0], called);  break;
      case 'middleRow': valid = this.checkRow(ticket[1], called);  break;
      case 'bottomRow': valid = this.checkRow(ticket[2], called);  break;
      case 'fullHousie': valid = this.checkFullHouse(ticket, called); break;
      default: return false;
    }

    if (valid) {
      room.claimedPrizes.add(claimType); // lock this prize
    }

    return valid;
  }

  checkEarly5(ticket, called) {
    let count = 0;
    for (const row of ticket) {
      for (const num of row) {
        if (num !== null && called.has(num)) {
          count++;
        }
      }
    }
    return count >= 5;
  }

  checkRow(row, called) {
    const numsInRow = row.filter(n => n !== null);
    return numsInRow.every(n => called.has(n));
  }

  checkFullHouse(ticket, called) {
    for (const row of ticket) {
      const numsInRow = row.filter(n => n !== null);
      if (!numsInRow.every(n => called.has(n))) return false;
    }
    return true;
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }
}

module.exports = RoomManager;
