const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const rooms = new Map();
const disconnectedPlayers = new Map(); // For reconnection

const playerColors = [
  "bg-blue-600",
  "bg-red-600",
  "bg-green-600",
  "bg-yellow-600",
];
const availablePieces = ["🚗", "🎩", "🚢", "🐕", "🐈", "👞", "🎸", "⚓"];

const CHANCE_CARDS = [
  {
    type: "money",
    title: "BANK ERROR!",
    description: "Bank error in your favor. Collect $200",
    amount: 200,
  },
  {
    type: "money",
    title: "DOCTOR'S FEE",
    description: "Doctor's fee. Pay $50",
    amount: -50,
  },
  {
    type: "money",
    title: "SALE OF STOCK",
    description: "From sale of stock you get $50",
    amount: 50,
  },
  {
    type: "jail_free",
    title: "GET OUT OF JAIL FREE",
    description: "This card may be kept until needed",
  },
  { type: "jail", title: "GO TO JAIL", description: "Go directly to jail" },
  {
    type: "move",
    title: "ADVANCE TO GO",
    description: "Advance to GO. Collect $200",
    position: 0,
  },
];

const COMMUNITY_CHEST_CARDS = [
  {
    type: "money",
    title: "LIFE INSURANCE",
    description: "Life insurance matures. Collect $100",
    amount: 100,
  },
  {
    type: "money",
    title: "HOSPITAL FEES",
    description: "Doctor's fees. Pay $50",
    amount: -50,
  },
  {
    type: "jail_free",
    title: "GET OUT OF JAIL FREE",
    description: "This card may be kept until needed",
  },
  {
    type: "money",
    title: "INHERITANCE",
    description: "You inherit $100",
    amount: 100,
  },
];

const properties = [
  {
    name: "GO",
    price: 0,
    rent: [0],
    color: "",
    position: 0,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Mediterranean Avenue",
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    color: "bg-purple-900",
    position: 1,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 50,
    mortgaged: false,
  },
  {
    name: "Community Chest",
    price: 0,
    rent: [0],
    color: "",
    position: 2,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Baltic Avenue",
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    color: "bg-purple-900",
    position: 3,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 50,
    mortgaged: false,
  },
  {
    name: "Income Tax",
    price: 0,
    rent: [0],
    color: "",
    position: 4,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Reading Railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    color: "",
    position: 5,
    owner: null,
    houses: 0,
    type: "railroad",
    mortgaged: false,
  },
  {
    name: "Oriental Avenue",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    color: "bg-sky-400",
    position: 6,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 50,
    mortgaged: false,
  },
  {
    name: "Chance",
    price: 0,
    rent: [0],
    color: "",
    position: 7,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Vermont Avenue",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    color: "bg-sky-400",
    position: 8,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 50,
    mortgaged: false,
  },
  {
    name: "Connecticut Avenue",
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    color: "bg-sky-400",
    position: 9,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 50,
    mortgaged: false,
  },
  {
    name: "Just Visiting",
    price: 0,
    rent: [0],
    color: "",
    position: 10,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "St. Charles Place",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    color: "bg-pink-600",
    position: 11,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 100,
    mortgaged: false,
  },
  {
    name: "Electric Company",
    price: 150,
    rent: [0],
    color: "",
    position: 12,
    owner: null,
    houses: 0,
    type: "utility",
    mortgaged: false,
  },
  {
    name: "States Avenue",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    color: "bg-pink-600",
    position: 13,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 100,
    mortgaged: false,
  },
  {
    name: "Virginia Avenue",
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    color: "bg-pink-600",
    position: 14,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 100,
    mortgaged: false,
  },
  {
    name: "Pennsylvania Railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    color: "",
    position: 15,
    owner: null,
    houses: 0,
    type: "railroad",
    mortgaged: false,
  },
  {
    name: "St. James Place",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    color: "bg-orange-600",
    position: 16,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 100,
    mortgaged: false,
  },
  {
    name: "Community Chest",
    price: 0,
    rent: [0],
    color: "",
    position: 17,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Tennessee Avenue",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    color: "bg-orange-600",
    position: 18,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 100,
    mortgaged: false,
  },
  {
    name: "New York Avenue",
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    color: "bg-orange-600",
    position: 19,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 100,
    mortgaged: false,
  },
  {
    name: "Free Parking",
    price: 0,
    rent: [0],
    color: "",
    position: 20,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Kentucky Avenue",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    color: "bg-red-600",
    position: 21,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 150,
    mortgaged: false,
  },
  {
    name: "Chance",
    price: 0,
    rent: [0],
    color: "",
    position: 22,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Indiana Avenue",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    color: "bg-red-600",
    position: 23,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 150,
    mortgaged: false,
  },
  {
    name: "Illinois Avenue",
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    color: "bg-red-600",
    position: 24,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 150,
    mortgaged: false,
  },
  {
    name: "B. & O. Railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    color: "",
    position: 25,
    owner: null,
    houses: 0,
    type: "railroad",
    mortgaged: false,
  },
  {
    name: "Atlantic Avenue",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    color: "bg-yellow-500",
    position: 26,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 150,
    mortgaged: false,
  },
  {
    name: "Ventnor Avenue",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    color: "bg-yellow-500",
    position: 27,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 150,
    mortgaged: false,
  },
  {
    name: "Water Works",
    price: 150,
    rent: [0],
    color: "",
    position: 28,
    owner: null,
    houses: 0,
    type: "utility",
    mortgaged: false,
  },
  {
    name: "Marvin Gardens",
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    color: "bg-yellow-500",
    position: 29,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 150,
    mortgaged: false,
  },
  {
    name: "Go To Jail",
    price: 0,
    rent: [0],
    color: "",
    position: 30,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Pacific Avenue",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    color: "bg-green-600",
    position: 31,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 200,
    mortgaged: false,
  },
  {
    name: "North Carolina Avenue",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    color: "bg-green-600",
    position: 32,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 200,
    mortgaged: false,
  },
  {
    name: "Community Chest",
    price: 0,
    rent: [0],
    color: "",
    position: 33,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Pennsylvania Avenue",
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    color: "bg-green-600",
    position: 34,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 200,
    mortgaged: false,
  },
  {
    name: "Short Line",
    price: 200,
    rent: [25, 50, 100, 200],
    color: "",
    position: 35,
    owner: null,
    houses: 0,
    type: "railroad",
    mortgaged: false,
  },
  {
    name: "Chance",
    price: 0,
    rent: [0],
    color: "",
    position: 36,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Park Place",
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    color: "bg-blue-900",
    position: 37,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 200,
    mortgaged: false,
  },
  {
    name: "Luxury Tax",
    price: 0,
    rent: [0],
    color: "",
    position: 38,
    owner: null,
    houses: 0,
    type: "special",
    mortgaged: false,
  },
  {
    name: "Boardwalk",
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    color: "bg-blue-900",
    position: 39,
    owner: null,
    houses: 0,
    type: "property",
    housePrice: 200,
    mortgaged: false,
  },
];

function createRoom(roomCode) {
  return {
    code: roomCode,
    players: [],
    gameStarted: false,
    currentPlayer: 0,
    properties: JSON.parse(JSON.stringify(properties)),
    dice: [1, 1],
    gameLog: [],
    turnInProgress: false,
    jailTurns: {},
  };
}

function broadcastGameState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  io.to(roomCode).emit("fullGameState", {
    players: room.players,
    properties: room.properties,
    currentPlayer: room.currentPlayer,
    dice: room.dice,
    gameLog: room.gameLog,
    gameStarted: room.gameStarted,
    turnInProgress: room.turnInProgress,
  });
}

function ownsMonopoly(gameRoom, playerId, color) {
  const colorProperties = gameRoom.properties.filter(
    (p) => p.color === color && p.type === "property"
  );
  return colorProperties.every((p) => p.owner === playerId);
}

function checkBankruptcy(gameRoom) {
  const bankruptPlayers = [];
  gameRoom.players.forEach((player, idx) => {
    if (player.money < 0 && !player.bankrupt) {
      player.bankrupt = true;
      player.isActive = false;
      bankruptPlayers.push(player.name);
      gameRoom.gameLog.push(`${player.name} is BANKRUPT!`);

      // Transfer properties back to bank
      gameRoom.properties.forEach((prop) => {
        if (prop.owner === idx) {
          prop.owner = null;
          prop.houses = 0;
          prop.mortgaged = false;
        }
      });
    }
  });

  const activePlayers = gameRoom.players.filter((p) => !p.bankrupt);
  if (activePlayers.length === 1) {
    gameRoom.gameLog.push(`🎉 ${activePlayers[0].name} WINS! 🎉`);
    io.to(gameRoom.code).emit("gameEnded", {
      message: `${activePlayers[0].name} wins!`,
      winner: activePlayers[0],
    });
    return activePlayers[0];
  }
  return null;
}

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("joinRoom", ({ room, name, isHost }) => {
    const roomCode = room.toUpperCase();

    if (!rooms.has(roomCode)) {
      if (!isHost) {
        socket.emit("error", { message: "Room does not exist" });
        return;
      }
      rooms.set(roomCode, createRoom(roomCode));
      console.log(`🏠 Room created: ${roomCode}`);
    }

    const gameRoom = rooms.get(roomCode);

    if (gameRoom.players.length >= 4) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    if (gameRoom.gameStarted) {
      socket.emit("error", { message: "Game already started" });
      return;
    }

    const playerId = gameRoom.players.length;
    const newPlayer = {
      id: playerId,
      socketId: socket.id,
      name: name,
      position: 0,
      money: 1500,
      properties: [],
      color: playerColors[playerId % playerColors.length],
      piece: availablePieces[playerId % availablePieces.length],
      isComputer: false,
      isActive: true,
      bankrupt: false,
      inJail: false,
      getOutOfJailFree: 0,
    };

    gameRoom.players.push(newPlayer);
    socket.join(roomCode);

    socket.emit("roomJoined", {
      players: gameRoom.players.map((p) => ({
        id: p.id,
        name: p.name,
        piece: p.piece,
        color: p.color,
      })),
      playerId: playerId,
      roomCode: roomCode,
      isHost: playerId === 0,
    });

    socket.to(roomCode).emit("playerJoined", {
      players: gameRoom.players.map((p) => ({
        id: p.id,
        name: p.name,
        piece: p.piece,
        color: p.color,
      })),
      playerName: name,
    });

    console.log(`👤 ${name} joined room ${roomCode} as player ${playerId}`);
  });

  socket.on("startGame", ({ roomCode }) => {
    const gameRoom = rooms.get(roomCode);

    if (!gameRoom) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    if (gameRoom.players.length < 2) {
      socket.emit("error", { message: "Need at least 2 players" });
      return;
    }

    const hostPlayer = gameRoom.players.find((p) => p.socketId === socket.id);
    if (!hostPlayer || hostPlayer.id !== 0) {
      socket.emit("error", { message: "Only host can start game" });
      return;
    }

    gameRoom.gameStarted = true;
    gameRoom.currentPlayer = 0;
    gameRoom.turnInProgress = false;
    gameRoom.gameLog.push("Game started!");

    io.to(roomCode).emit("gameStarted", {
      players: gameRoom.players,
      currentPlayer: 0,
    });

    broadcastGameState(roomCode);

    console.log(`🎮 Game started in room ${roomCode}`);
  });

  socket.on("chat", ({ roomCode, playerId, message }) => {
    const gameRoom = rooms.get(roomCode);
    if (!gameRoom) return;

    const player = gameRoom.players[playerId];
    if (!player) return;

    io.to(roomCode).emit("chat", {
      playerId,
      playerName: player.name,
      message,
    });
  });

  socket.on("rollDice", ({ roomCode, playerId }) => {
    const gameRoom = rooms.get(roomCode);

    if (!gameRoom || !gameRoom.gameStarted) {
      socket.emit("error", { message: "Invalid game state" });
      return;
    }

    if (gameRoom.currentPlayer !== playerId) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    if (gameRoom.turnInProgress) {
      socket.emit("error", { message: "Wait for current turn to finish" });
      return;
    }

    gameRoom.turnInProgress = true;

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    gameRoom.dice = [die1, die2];

    const player = gameRoom.players[playerId];

    io.to(roomCode).emit("diceRolled", {
      dice: [die1, die2],
      playerId: playerId,
      playerName: player.name,
    });

    setTimeout(() => {
      // Handle jail
      if (player.inJail) {
        const jailTurns = gameRoom.jailTurns[playerId] || 0;
        if (die1 === die2) {
          player.inJail = false;
          gameRoom.jailTurns[playerId] = 0;
          gameRoom.gameLog.push(
            `${player.name} rolled doubles and escaped jail!`
          );
        } else {
          gameRoom.jailTurns[playerId] = jailTurns + 1;
          if (gameRoom.jailTurns[playerId] >= 3) {
            player.inJail = false;
            player.money -= 50;
            gameRoom.jailTurns[playerId] = 0;
            gameRoom.gameLog.push(`${player.name} paid $50 to leave jail`);
          } else {
            gameRoom.gameLog.push(
              `${player.name} stayed in jail. ${
                3 - gameRoom.jailTurns[playerId]
              } turns left.`
            );
            gameRoom.turnInProgress = false;
            gameRoom.currentPlayer =
              (gameRoom.currentPlayer + 1) % gameRoom.players.length;
            while (gameRoom.players[gameRoom.currentPlayer].bankrupt) {
              gameRoom.currentPlayer =
                (gameRoom.currentPlayer + 1) % gameRoom.players.length;
            }
            io.to(roomCode).emit("turnChanged", {
              currentPlayer: gameRoom.currentPlayer,
              playerName: gameRoom.players[gameRoom.currentPlayer].name,
              roomCode,
            });
            broadcastGameState(roomCode);
            return;
          }
        }
      }

      const diceTotal = die1 + die2;
      const oldPosition = player.position;
      let newPosition = oldPosition + diceTotal;

      if (newPosition >= 40) {
        player.money += 200;
        gameRoom.gameLog.push(`${player.name} passed GO! Collected $200`);
        newPosition = newPosition % 40;
      }

      player.position = newPosition;
      const property = gameRoom.properties[newPosition];

      let shouldSwitchTurn = true;
      let message = "";

      if (property.name === "Go To Jail") {
        player.position = 10;
        player.inJail = true;
        gameRoom.jailTurns[playerId] = 0;
        message = `${player.name} went to Jail!`;
        gameRoom.gameLog.push(message);
      } else if (property.name === "Income Tax") {
        player.money -= 200;
        message = `${player.name} paid $200 income tax`;
        gameRoom.gameLog.push(message);
      } else if (property.name === "Luxury Tax") {
        player.money -= 100;
        message = `${player.name} paid $100 luxury tax`;
        gameRoom.gameLog.push(message);
      } else if (property.name === "Chance") {
        const card =
          CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
        if (card.type === "money") {
          player.money += card.amount;
          message = `${player.name} ${
            card.amount > 0 ? "received" : "paid"
          } $${Math.abs(card.amount)}`;
        } else if (card.type === "jail") {
          player.position = 10;
          player.inJail = true;
          gameRoom.jailTurns[playerId] = 0;
          message = `${player.name} went to Jail!`;
        } else if (card.type === "jail_free") {
          player.getOutOfJailFree += 1;
          message = `${player.name} got Get Out of Jail Free card!`;
        } else if (card.type === "move" && card.position !== undefined) {
          player.position = card.position;
          if (card.position === 0) player.money += 200;
          message = `${player.name} advanced to ${property.name}`;
        }
        gameRoom.gameLog.push(message);
      } else if (property.name === "Community Chest") {
        const card =
          COMMUNITY_CHEST_CARDS[
            Math.floor(Math.random() * COMMUNITY_CHEST_CARDS.length)
          ];
        if (card.type === "money") {
          player.money += card.amount;
          message = `${player.name} ${
            card.amount > 0 ? "received" : "paid"
          } $${Math.abs(card.amount)}`;
        } else if (card.type === "jail_free") {
          player.getOutOfJailFree += 1;
          message = `${player.name} got Get Out of Jail Free card!`;
        }
        gameRoom.gameLog.push(message);
      } else if (property.price > 0) {
        if (property.owner === null) {
          shouldSwitchTurn = false;
          io.to(roomCode).emit("propertyLanded", {
            playerId: playerId,
            players: gameRoom.players,
            propertyPosition: newPosition,
            propertyName: property.name,
            propertyPrice: property.price,
            playerMoney: player.money,
          });
        } else if (property.owner !== playerId && !property.mortgaged) {
          const rent = property.rent[property.houses];
          io.to(roomCode).emit("payRent", {
            playerId,
            position: newPosition,
            roomCode,
          });
          player.money -= rent;
          gameRoom.players[property.owner].money += rent;
          message = `${player.name} paid $${rent} rent to ${
            gameRoom.players[property.owner].name
          }`;
          gameRoom.gameLog.push(message);
        }
      }

      io.to(roomCode).emit("playerMoved", {
        playerId: playerId,
        newPosition: player.position,
        newMoney: player.money,
        message: message,
      });

      checkBankruptcy(gameRoom);
      broadcastGameState(roomCode);

      if (shouldSwitchTurn) {
        setTimeout(() => {
          gameRoom.currentPlayer =
            (gameRoom.currentPlayer + 1) % gameRoom.players.length;
          while (gameRoom.players[gameRoom.currentPlayer].bankrupt) {
            gameRoom.currentPlayer =
              (gameRoom.currentPlayer + 1) % gameRoom.players.length;
          }
          gameRoom.turnInProgress = false;

          io.to(roomCode).emit("turnChanged", {
            currentPlayer: gameRoom.currentPlayer,
            playerName: gameRoom.players[gameRoom.currentPlayer].name,
            roomCode,
          });

          broadcastGameState(roomCode);
        }, 2000);
      }
    }, 1000);
  });

  socket.on("buyProperty", ({ roomCode, propertyPosition, playerId }) => {
    const gameRoom = rooms.get(roomCode);

    if (!gameRoom || !gameRoom.gameStarted) {
      socket.emit("error", { message: "Invalid game state" });
      return;
    }

    const player = gameRoom.players[playerId];
    const property = gameRoom.properties[propertyPosition];

    if (!player || !property) {
      socket.emit("error", { message: "Invalid player or property" });
      return;
    }

    if (property.owner !== null) {
      socket.emit("error", { message: "Property already owned" });
      return;
    }

    if (player.money < property.price) {
      socket.emit("error", { message: "Not enough money" });
      return;
    }

    player.money -= property.price;
    player.properties.push(propertyPosition);
    property.owner = playerId;

    const message = `${player.name} bought ${property.name} for $${property.price}`;
    gameRoom.gameLog.push(message);

    io.to(roomCode).emit("propertyPurchased", {
      playerId: playerId,
      playerName: player.name,
      propertyPosition: propertyPosition,
      propertyName: property.name,
      newMoney: player.money,
    });

    broadcastGameState(roomCode);

    setTimeout(() => {
      gameRoom.currentPlayer =
        (gameRoom.currentPlayer + 1) % gameRoom.players.length;
      while (gameRoom.players[gameRoom.currentPlayer].bankrupt) {
        gameRoom.currentPlayer =
          (gameRoom.currentPlayer + 1) % gameRoom.players.length;
      }
      gameRoom.turnInProgress = false;

      io.to(roomCode).emit("turnChanged", {
        currentPlayer: gameRoom.currentPlayer,
        playerName: gameRoom.players[gameRoom.currentPlayer].name,
        roomCode,
      });

      broadcastGameState(roomCode);
    }, 1500);
  });

  socket.on("skipProperty", ({ roomCode, playerId }) => {
    const gameRoom = rooms.get(roomCode);

    if (!gameRoom || !gameRoom.gameStarted) {
      socket.emit("error", { message: "Invalid game state" });
      return;
    }

    const player = gameRoom.players[playerId];

    if (!player) {
      socket.emit("error", { message: "Invalid player" });
      return;
    }

    gameRoom.gameLog.push(`${player.name} skipped the property`);

    io.to(roomCode).emit("propertySkipped", {
      playerId: playerId,
      playerName: player.name,
    });

    broadcastGameState(roomCode);

    setTimeout(() => {
      gameRoom.currentPlayer =
        (gameRoom.currentPlayer + 1) % gameRoom.players.length;
      while (gameRoom.players[gameRoom.currentPlayer].bankrupt) {
        gameRoom.currentPlayer =
          (gameRoom.currentPlayer + 1) % gameRoom.players.length;
      }
      gameRoom.turnInProgress = false;

      io.to(roomCode).emit("turnChanged", {
        currentPlayer: gameRoom.currentPlayer,
        playerName: gameRoom.players[gameRoom.currentPlayer].name,
        roomCode,
      });

      broadcastGameState(roomCode);
    }, 1500);
  });

  socket.on("skipTurn", ({ roomCode, playerId }) => {
    const gameRoom = rooms.get(roomCode);

    if (!gameRoom || !gameRoom.gameStarted) {
      socket.emit("error", { message: "Invalid game state" });
      return;
    }

    if (gameRoom.currentPlayer !== playerId) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const player = gameRoom.players[playerId];

    if (!player) {
      socket.emit("error", { message: "Invalid player" });
      return;
    }

    gameRoom.gameLog.push(`${player.name}'s turn skipped (timeout)`);
    gameRoom.turnInProgress = false;

    gameRoom.currentPlayer =
      (gameRoom.currentPlayer + 1) % gameRoom.players.length;
    while (gameRoom.players[gameRoom.currentPlayer].bankrupt) {
      gameRoom.currentPlayer =
        (gameRoom.currentPlayer + 1) % gameRoom.players.length;
    }

    io.to(roomCode).emit("turnChanged", {
      currentPlayer: gameRoom.currentPlayer,
      playerName: gameRoom.players[gameRoom.currentPlayer].name,
      roomCode,
    });

    broadcastGameState(roomCode);

    console.log(
      `⏱️ ${player.name}'s turn skipped due to timeout in room ${roomCode}`
    );
  });

  socket.on("buyHouse", ({ roomCode, propertyPosition, playerId }) => {
    const gameRoom = rooms.get(roomCode);

    if (!gameRoom || !gameRoom.gameStarted) {
      socket.emit("error", { message: "Invalid game state" });
      return;
    }

    const player = gameRoom.players[playerId];
    const property = gameRoom.properties[propertyPosition];

    if (!player || !property) {
      socket.emit("error", { message: "Invalid player or property" });
      return;
    }

    if (property.type !== "property" || !property.housePrice) {
      socket.emit("error", { message: "Cannot build on this property" });
      return;
    }

    if (property.owner !== playerId) {
      socket.emit("error", { message: "You don't own this property" });
      return;
    }

    if (property.houses >= 5) {
      socket.emit("error", { message: "Already has hotel" });
      return;
    }

    if (property.mortgaged) {
      socket.emit("error", { message: "Cannot build on mortgaged property" });
      return;
    }

    if (!ownsMonopoly(gameRoom, playerId, property.color)) {
      socket.emit("error", { message: "Need monopoly to build" });
      return;
    }

    if (player.money < property.housePrice) {
      socket.emit("error", { message: "Not enough money" });
      return;
    }

    player.money -= property.housePrice;
    property.houses += 1;

    const buildingName = property.houses === 5 ? "hotel" : "house";
    const message = `${player.name} built ${buildingName} on ${property.name}`;
    gameRoom.gameLog.push(message);

    io.to(roomCode).emit("houseBought", {
      playerId: playerId,
      playerName: player.name,
      propertyPosition: propertyPosition,
      propertyName: property.name,
      houses: property.houses,
      newMoney: player.money,
      buildingName: buildingName,
    });

    broadcastGameState(roomCode);

    console.log(`🏠 ${player.name} built ${buildingName} on ${property.name}`);
  });

  socket.on("sellHouse", ({ roomCode, propertyPosition, playerId }) => {
    const gameRoom = rooms.get(roomCode);

    if (!gameRoom || !gameRoom.gameStarted) {
      socket.emit("error", { message: "Invalid game state" });
      return;
    }

    const player = gameRoom.players[playerId];
    const property = gameRoom.properties[propertyPosition];

    if (!player || !property) {
      socket.emit("error", { message: "Invalid player or property" });
      return;
    }

    if (property.type !== "property" || !property.housePrice) {
      socket.emit("error", { message: "Cannot sell from this property" });
      return;
    }

    if (property.owner !== playerId) {
      socket.emit("error", { message: "You don't own this property" });
      return;
    }

    if (property.houses === 0) {
      socket.emit("error", { message: "No buildings to sell" });
      return;
    }

    const sellPrice = Math.floor(property.housePrice / 2);
    const wasHotel = property.houses === 5;
    property.houses -= 1;
    player.money += sellPrice;

    const buildingName = wasHotel ? "hotel" : "house";
    const message = `${player.name} sold ${buildingName} on ${property.name} for ${sellPrice}`;
    gameRoom.gameLog.push(message);

    io.to(roomCode).emit("houseSold", {
      playerId: playerId,
      playerName: player.name,
      propertyPosition: propertyPosition,
      propertyName: property.name,
      houses: property.houses,
      newMoney: player.money,
      buildingName: buildingName,
      sellPrice: sellPrice,
    });

    broadcastGameState(roomCode);

    console.log(`💰 ${player.name} sold ${buildingName} on ${property.name}`);
  });

  socket.on("mortgageProperty", ({ roomCode, propertyPosition, playerId }) => {
    const gameRoom = rooms.get(roomCode);

    if (!gameRoom || !gameRoom.gameStarted) {
      socket.emit("error", { message: "Invalid game state" });
      return;
    }

    const player = gameRoom.players[playerId];
    const property = gameRoom.properties[propertyPosition];

    if (!player || !property) {
      socket.emit("error", { message: "Invalid player or property" });
      return;
    }

    if (property.owner !== playerId) {
      socket.emit("error", { message: "You don't own this property" });
      return;
    }

    if (property.mortgaged) {
      socket.emit("error", { message: "Already mortgaged" });
      return;
    }

    if (property.houses > 0) {
      socket.emit("error", {
        message: "Cannot mortgage property with buildings",
      });
      return;
    }

    const mortgageValue = Math.floor(property.price / 2);
    player.money += mortgageValue;
    property.mortgaged = true;

    gameRoom.gameLog.push(
      `${player.name} mortgaged ${property.name} for ${mortgageValue}`
    );

    io.to(roomCode).emit("propertyMortgaged", {
      playerId: playerId,
      playerName: player.name,
      propertyPosition: propertyPosition,
      propertyName: property.name,
      mortgageValue: mortgageValue,
      newMoney: player.money,
    });

    broadcastGameState(roomCode);
  });

  socket.on(
    "unmortgageProperty",
    ({ roomCode, propertyPosition, playerId }) => {
      const gameRoom = rooms.get(roomCode);

      if (!gameRoom || !gameRoom.gameStarted) {
        socket.emit("error", { message: "Invalid game state" });
        return;
      }

      const player = gameRoom.players[playerId];
      const property = gameRoom.properties[propertyPosition];

      if (!player || !property) {
        socket.emit("error", { message: "Invalid player or property" });
        return;
      }

      if (property.owner !== playerId) {
        socket.emit("error", { message: "You don't own this property" });
        return;
      }

      if (!property.mortgaged) {
        socket.emit("error", { message: "Property not mortgaged" });
        return;
      }

      const unmortgageCost = Math.floor(property.price * 0.55);
      if (player.money < unmortgageCost) {
        socket.emit("error", { message: "Not enough money to unmortgage" });
        return;
      }

      player.money -= unmortgageCost;
      property.mortgaged = false;

      gameRoom.gameLog.push(
        `${player.name} unmortgaged ${property.name} for ${unmortgageCost}`
      );

      io.to(roomCode).emit("propertyUnmortgaged", {
        playerId: playerId,
        playerName: player.name,
        propertyPosition: propertyPosition,
        propertyName: property.name,
        unmortgageCost: unmortgageCost,
        newMoney: player.money,
      });

      broadcastGameState(roomCode);
    }
  );

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    rooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex(
        (p) => p.socketId === socket.id
      );
      if (playerIndex !== -1) {
        const playerName = room.players[playerIndex].name;

        // Store disconnected player info for potential reconnection
        disconnectedPlayers.set(socket.id, {
          roomCode,
          playerIndex,
          timestamp: Date.now(),
        });

        // Give them 60 seconds to reconnect
        setTimeout(() => {
          const disconnectInfo = disconnectedPlayers.get(socket.id);
          if (disconnectInfo) {
            disconnectedPlayers.delete(socket.id);

            const currentRoom = rooms.get(roomCode);
            if (currentRoom) {
              currentRoom.players.splice(playerIndex, 1);

              if (currentRoom.players.length === 0) {
                rooms.delete(roomCode);
                console.log(`🗑️ Room ${roomCode} deleted`);
              } else {
                io.to(roomCode).emit("playerLeft", {
                  playerName: playerName,
                  players: currentRoom.players.map((p) => ({
                    id: p.id,
                    name: p.name,
                    piece: p.piece,
                    color: p.color,
                  })),
                });

                if (currentRoom.gameStarted) {
                  currentRoom.gameStarted = false;
                  io.to(roomCode).emit("gameEnded", {
                    message: `${playerName} left. Game ended.`,
                  });
                }
              }
            }
          }
        }, 60000);
      }
    });
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    rooms: rooms.size,
    activePlayers: Array.from(rooms.values()).reduce(
      (sum, room) => sum + room.players.length,
      0
    ),
    timestamp: new Date().toISOString(),
  });
});

app.get("/stats", (req, res) => {
  const roomStats = Array.from(rooms.entries()).map(([code, room]) => ({
    code,
    players: room.players.length,
    gameStarted: room.gameStarted,
  }));

  res.json({
    totalRooms: rooms.size,
    rooms: roomStats,
    disconnectedPlayers: disconnectedPlayers.size,
  });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`🎲 STARKCITY Monopoly Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Socket.IO Ready`);
  console.log(`✨ Enhanced with all new features!`);
});
