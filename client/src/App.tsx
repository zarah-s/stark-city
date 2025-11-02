import { useState, useEffect, useRef } from "react";
import {
  DollarSign,
  List,
  X,
  Users,
  Cpu,
  Copy,
  Check,
  Play,
  Home,
  Building2,
  Sparkles,
  MessageCircle,
  Trophy,
  Info,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import {
  AVAILABLE_PIECES,
  PROPERTIES,
  SOCKET_SERVER_URL,
  CHANCE_CARDS,
  COMMUNITY_CHEST_CARDS,
} from "./utils/constants";
import type { Player, Property, ChanceCard } from "./utils/interfaces";
import { PropertySpace } from "./components/PropertySpace";
import { DiceIcon } from "./components/DiceIcon";
import type { AccountInterface } from "starknet";
import { useAccount, useConnect } from "@starknet-react/core";
import useInteraction from "./hooks/interaction";
import { toast } from "react-toastify";

interface Wallet {
  IsConnected: boolean;
  Account: AccountInterface | undefined;
}

declare global {
  interface Window {
    Wallet: Wallet;
  }
}

export default function App() {
  const { account } = useAccount();
  const { connectAsync, connectors } = useConnect();

  // Game State
  const [showSplash, setShowSplash] = useState(true);
  const [gameMode, setGameMode] = useState<"menu" | "computer" | "online">(
    "menu"
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  // Online Mode State
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [shouldJoin, setShouldJoin] = useState<null | string>(null);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<number>(0);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Game Board State
  const [gameProperties, setGameProperties] = useState<Property[]>(PROPERTIES);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [message, setMessage] = useState("Choose your game mode!");
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [jailTurns, setJailTurns] = useState<{ [key: number]: number }>({});

  // UI State
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(false);
  const [showManageProperties, setShowManageProperties] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: string; message: string }>
  >([]);
  const [showPropertyDetails, setShowPropertyDetails] =
    useState<Property | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [currentCard, setCurrentCard] = useState<ChanceCard | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [turnTimer, setTurnTimer] = useState(30);
  const timerRef = useRef<any>(null);

  const { call } = useInteraction();

  // ===============================================
  // UTILITY FUNCTIONS
  // ===============================================

  const playSound = (type: "dice" | "buy" | "money" | "jail" | "win") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      switch (type) {
        case "dice":
          osc.frequency.value = 200;
          gain.gain.value = 0.1;
          osc.start();
          setTimeout(() => (osc.frequency.value = 300), 50);
          setTimeout(() => osc.stop(), 150);
          break;
        case "buy":
          osc.frequency.value = 400;
          gain.gain.value = 0.15;
          osc.start();
          setTimeout(() => (osc.frequency.value = 600), 100);
          setTimeout(() => osc.stop(), 200);
          break;
        case "money":
          osc.frequency.value = 500;
          gain.gain.value = 0.1;
          osc.start();
          setTimeout(() => osc.stop(), 100);
          break;
        case "jail":
          osc.frequency.value = 150;
          gain.gain.value = 0.2;
          osc.start();
          setTimeout(() => osc.stop(), 300);
          break;
        case "win":
          osc.frequency.value = 600;
          gain.gain.value = 0.2;
          osc.start();
          setTimeout(() => (osc.frequency.value = 800), 200);
          setTimeout(() => osc.stop(), 400);
          break;
      }
    } catch {}
  };

  const addLog = (msg: string) => {
    setGameLog((prev) => [...prev.slice(-9), msg]);
  };

  const ownsMonopoly = (playerId: number, color: string): boolean => {
    const colorProperties = gameProperties.filter(
      (p) => p.color === color && p.type === "property"
    );
    return colorProperties.every((p) => p.owner === playerId);
  };

  const checkBankruptcy = () => {
    const newPlayers = [...players];
    let bankruptCount = 0;

    newPlayers.forEach((p, idx) => {
      if (p.money < 0 && !p.bankrupt) {
        addLog(`${p.name} is BANKRUPT!`);
        p.bankrupt = true;
        p.isActive = false;

        // Return properties to bank
        gameProperties.forEach((prop) => {
          if (prop.owner === idx) {
            prop.owner = null;
            prop.houses = 0;
            prop.mortgaged = false;
          }
        });
        setGameProperties([...gameProperties]);
      }
      if (p.bankrupt) bankruptCount++;
    });

    setPlayers(newPlayers);

    const activePlayers = newPlayers.filter((p) => !p.bankrupt);
    if (activePlayers.length === 1) {
      setWinner(activePlayers[0]);
      setMessage(`🎉 ${activePlayers[0].name} WINS! 🎉`);
      playSound("win");
      stopTurnTimer();
    }
  };

  const endTurn = () => {
    checkBankruptcy();
    const activePlayers = players.filter((p) => !p.bankrupt);
    if (activePlayers.length <= 1) return;

    let nextPlayer = (currentPlayer + 1) % players.length;
    while (players[nextPlayer]?.bankrupt) {
      nextPlayer = (nextPlayer + 1) % players.length;
    }

    setCurrentPlayer(nextPlayer);
    setCanRoll(true);
    setMessage(`${players[nextPlayer].name}'s turn`);
  };

  // ===============================================
  // TURN TIMER
  // ===============================================

  const startTurnTimer = () => {
    setTurnTimer(30);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          if (
            gameMode === "online" &&
            socketRef.current &&
            currentPlayer === myPlayerId &&
            canRoll
          ) {
            socketRef.current.emit("skipTurn", {
              roomCode,
              playerId: myPlayerId,
            });
          } else if (
            gameMode === "computer" &&
            !players[currentPlayer]?.isComputer
          ) {
            endTurn();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTurnTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTurnTimer(30);
  };

  useEffect(() => {
    if (gameStarted && canRoll && !showBuyModal && !showCardModal && !winner) {
      if (gameMode === "online" && currentPlayer === myPlayerId) {
        startTurnTimer();
      } else if (
        gameMode === "computer" &&
        !players[currentPlayer]?.isComputer
      ) {
        startTurnTimer();
      }
    } else {
      stopTurnTimer();
    }

    return () => {
      stopTurnTimer();
    };
  }, [
    gameMode,
    gameStarted,
    currentPlayer,
    myPlayerId,
    canRoll,
    showBuyModal,
    showCardModal,
    winner,
  ]);

  // ===============================================
  // WALLET CONNECTION
  // ===============================================

  async function enterGame(mode: "computer" | "online") {
    try {
      if (!window.Wallet?.IsConnected) {
        await connectAsync({ connector: connectors[0] });
      }
      setGameMode(mode);
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect wallet");
    }
  }

  useEffect(() => {
    (async function () {
      if (!roomCreated) return;
      if (roomJoined) return;
      if (isHost) {
        if (!shouldJoin) return;
        console.log("JOINING GAME");
        await call("joinGame", shouldJoin, 0);
        setRoomJoined(true);
      }
    })();
  }, [roomCreated]);

  useEffect(() => {
    (async function () {
      try {
        if (showSplash) return;
        if (!account) return;
        if (window.Wallet?.Account) return;
        window.Wallet = {
          Account: account,
          IsConnected: true,
        };
      } catch (error) {
        console.error(error);
      }
    })();
  }, [showSplash, account]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // ===============================================
  // SOCKET.IO CONNECTION & EVENTS
  // ===============================================

  const connectSocket = (room: string, name: string, host: boolean) => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // CONNECTION EVENTS
    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
      socket.emit("joinRoom", { room, name, isHost: host });
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      toast.error("Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      toast.error("Failed to connect to server");
    });

    // ROOM EVENTS
    socket.on("roomJoined", async (data: any) => {
      try {
        console.log("Room joined:", data);
        const player = data.players.find(
          (fd: any) => fd.id.toString() === data.playerId.toString()
        );
        if (!player) return;

        const pieceIndex = AVAILABLE_PIECES.findIndex(
          (fd) => fd === player.piece
        );
        if (pieceIndex === -1) return;

        setConnectedPlayers(data.players);
        setMyPlayerId(data.playerId);
        setRoomCode(data.roomCode);
        setIsHost(data.isHost);
        addLog(`You joined room ${data.roomCode}`);
        setMessage(`Room: ${data.roomCode}`);

        if (!isHost) {
          console.log("Joining game on contract");
          await call("joinGame", data.roomCode, pieceIndex);
        }
      } catch (error: any) {
        console.error("Room join error:", error);
        toast.error(error.message || "Failed to join room");
      }
    });

    socket.on("playerJoined", (data: any) => {
      console.log("Player joined:", data);
      setConnectedPlayers(data.players);
      addLog(`${data.playerName} joined`);
      toast.success(`${data.playerName} joined the room!`);
    });

    socket.on("playerLeft", (data: any) => {
      console.log("Player left:", data);
      setConnectedPlayers(data.players);
      addLog(`${data.playerName} left`);
      toast.info(`${data.playerName} left the room`);
    });

    // GAME START EVENT
    socket.on("gameStarted", (data: any) => {
      console.log("Game started:", data);
      setPlayers(data.players);
      setGameStarted(true);
      setCurrentPlayer(data.currentPlayer);
      setCanRoll(data.currentPlayer === myPlayerId);
      setMessage(`${data.players[data.currentPlayer].name}'s turn`);
      toast.success("Game started! Good luck!");
    });

    // GAME STATE SYNC
    socket.on("fullGameState", (state: any) => {
      console.log("Full game state received:", state);
      const myPlayer = state.players.find(
        (fd: any) => fd.socketId?.toLowerCase() === socket.id?.toLowerCase()
      );
      if (!myPlayer) return;

      setGameProperties(state.properties);
      setPlayers(state.players);
      setCurrentPlayer(state.currentPlayer);
      setDice(state.dice);
      setGameLog(state.gameLog);
      setGameStarted(state.gameStarted);
      setCanRoll(
        state.currentPlayer === myPlayer.id &&
          state.gameStarted &&
          !state.turnInProgress
      );
    });

    // DICE EVENTS
    socket.on("diceRolled", (data: any) => {
      console.log("Dice rolled:", data);
      setDice(data.dice);
      setIsRolling(true);
      setCanRoll(false);
      playSound("dice");
      addLog(`${data.playerName} rolled ${data.dice[0]}+${data.dice[1]}`);
      setTimeout(() => setIsRolling(false), 1000);
    });

    // MOVEMENT EVENTS
    socket.on("playerMoved", (data: any) => {
      console.log("Player moved:", data);
      const newPlayers = [...players];
      if (newPlayers[data.playerId]) {
        newPlayers[data.playerId].position = data.newPosition;
        newPlayers[data.playerId].money = data.newMoney;
        if (data.inJail !== undefined) {
          newPlayers[data.playerId].inJail = data.inJail;
        }
        setPlayers(newPlayers);
        if (data.message) {
          setMessage(data.message);
          addLog(data.message);
        }
      }
    });

    // CARD EVENTS
    socket.on("cardDrawn", (data: any) => {
      console.log("Card drawn:", data);
      setCurrentCard(data.card);
      setShowCardModal(true);
      setTimeout(() => {
        setShowCardModal(false);
        setCurrentCard(null);
      }, 3000);
    });

    // PROPERTY EVENTS
    socket.on("propertyLanded", (data: any) => {
      console.log("Property landed:", data);
      const myPlayer = data.players.find(
        (fd: any) => fd.socketId?.toLowerCase() === socket.id?.toLowerCase()
      );
      if (!myPlayer) return;

      if (data.playerId === myPlayer.id) {
        const prop = gameProperties[data.propertyPosition];
        setCurrentProperty(prop);
        setShowBuyModal(true);
        setMessage(`Buy ${data.propertyName}?`);
        setCanRoll(false);
      }
    });

    socket.on("propertyPurchased", (data: any) => {
      console.log("Property purchased:", data);
      const newProperties = [...gameProperties];
      newProperties[data.propertyPosition].owner = data.playerId;
      setGameProperties(newProperties);

      const newPlayers = [...players];
      if (newPlayers[data.playerId]) {
        newPlayers[data.playerId].money = data.newMoney;
        newPlayers[data.playerId].properties.push(data.propertyPosition);
        setPlayers(newPlayers);
      }

      addLog(`${data.playerName} bought ${data.propertyName}`);
      setShowBuyModal(false);
      setCurrentProperty(null);
      playSound("buy");
      toast.success(`${data.playerName} bought ${data.propertyName}`);
    });

    socket.on("propertySkipped", () => {
      console.log("Property skipped");
      setShowBuyModal(false);
      setCurrentProperty(null);
    });

    // BUILDING EVENTS
    socket.on("houseBought", (data: any) => {
      console.log("House bought:", data);
      const newProperties = [...gameProperties];
      newProperties[data.propertyPosition].houses = data.houses;
      setGameProperties(newProperties);

      const newPlayers = [...players];
      if (newPlayers[data.playerId]) {
        newPlayers[data.playerId].money = data.newMoney;
        setPlayers(newPlayers);
      }

      addLog(
        `${data.playerName} built ${data.buildingName} on ${data.propertyName}`
      );
      setMessage(`${data.playerName} built ${data.buildingName}!`);
      playSound("buy");
      toast.success(`${data.playerName} built ${data.buildingName}`);
    });

    socket.on("houseSold", (data: any) => {
      console.log("House sold:", data);
      const newProperties = [...gameProperties];
      newProperties[data.propertyPosition].houses = data.houses;
      setGameProperties(newProperties);

      const newPlayers = [...players];
      if (newPlayers[data.playerId]) {
        newPlayers[data.playerId].money = data.newMoney;
        setPlayers(newPlayers);
      }

      addLog(
        `${data.playerName} sold ${data.buildingName} on ${data.propertyName}`
      );
      playSound("money");
      toast.info(`${data.playerName} sold ${data.buildingName}`);
    });

    // MORTGAGE EVENTS
    socket.on("propertyMortgaged", (data: any) => {
      console.log("Property mortgaged:", data);
      const newProperties = [...gameProperties];
      newProperties[data.propertyPosition].mortgaged = true;
      setGameProperties(newProperties);

      const newPlayers = [...players];
      if (newPlayers[data.playerId]) {
        newPlayers[data.playerId].money = data.newMoney;
        setPlayers(newPlayers);
      }

      addLog(`${data.playerName} mortgaged ${data.propertyName}`);
      playSound("money");
      toast.info(`${data.playerName} mortgaged ${data.propertyName}`);
    });

    socket.on("propertyUnmortgaged", (data: any) => {
      console.log("Property unmortgaged:", data);
      const newProperties = [...gameProperties];
      newProperties[data.propertyPosition].mortgaged = false;
      setGameProperties(newProperties);

      const newPlayers = [...players];
      if (newPlayers[data.playerId]) {
        newPlayers[data.playerId].money = data.newMoney;
        setPlayers(newPlayers);
      }

      addLog(`${data.playerName} unmortgaged ${data.propertyName}`);
      playSound("buy");
      toast.success(`${data.playerName} unmortgaged ${data.propertyName}`);
    });

    // TURN EVENTS
    socket.on("turnChanged", async (data: any) => {
      console.log("Turn changed:", data);
      try {
        setCurrentPlayer(data.currentPlayer);
        setCanRoll(data.currentPlayer === myPlayerId);
        setMessage(`${data.playerName}'s turn`);

        if (gameMode === "online") {
          await call("nextTurn", data.roomCode);
        }
      } catch (error: any) {
        console.error("Turn change error:", error);
        toast.error(error.message || "Turn change failed");
      }
    });

    socket.on("payRent", async (data: any) => {
      console.log("Pay rent:", data);
      try {
        if (data.playerId === myPlayerId && gameMode === "online") {
          await call("payRent", data.roomCode, data.position);
        }
      } catch (error: any) {
        console.error("Pay rent error:", error);
        toast.error(error.message || "Rent payment failed");
      }
    });

    // BANKRUPTCY & WIN EVENTS
    socket.on("playerBankrupt", (data: any) => {
      console.log("Player bankrupt:", data);
      const newPlayers = [...players];
      if (newPlayers[data.playerId]) {
        newPlayers[data.playerId].bankrupt = true;
        newPlayers[data.playerId].isActive = false;
        setPlayers(newPlayers);
      }
      addLog(`${data.playerName} is BANKRUPT!`);
      toast.error(`${data.playerName} went bankrupt!`);
    });

    socket.on("gameWon", (data: any) => {
      console.log("Game won:", data);
      const winningPlayer = players.find((p) => p.id === data.winnerId);
      if (winningPlayer) {
        setWinner(winningPlayer);
        setMessage(`🎉 ${data.playerName} WINS! 🎉`);
        playSound("win");
        stopTurnTimer();
        toast.success(`🎉 ${data.playerName} won the game!`);
      }
    });

    socket.on("gameEnded", (data: any) => {
      console.log("Game ended:", data);
      setMessage(data.message);
      setGameStarted(false);
      toast.info(data.message);
    });

    // CHAT EVENTS
    socket.on("chat", (data: any) => {
      console.log("Chat message:", data);
      setChatMessages((prev) => [
        ...prev,
        { sender: data.playerName, message: data.message },
      ]);
    });

    // ERROR EVENTS
    socket.on("error", (error: any) => {
      console.error("Socket error:", error);
      setMessage(error.message);
      toast.error(error.message);
    });

    socketRef.current = socket;
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket");
        socketRef.current.disconnect();
      }
    };
  }, []);

  // ===============================================
  // ONLINE GAME FUNCTIONS
  // ===============================================

  const createRoom = async () => {
    try {
      if (!playerName.trim()) {
        toast.error("Please enter your name");
        return;
      }

      setCreatingRoom(true);
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log("Creating room:", code);

      const tx = await call("createGame", code);
      if (tx) {
        setShouldJoin(code);
        setRoomCreated(true);
        connectSocket(code, playerName, true);
        toast.success(`Room ${code} created!`);
      }
      setCreatingRoom(false);
    } catch (error: any) {
      console.error("Create room error:", error);
      toast.error(error.message || "Failed to create room");
      setCreatingRoom(false);
    }
  };

  const joinRoom = async (roomCode: string) => {
    try {
      if (!roomCode.trim() || !playerName.trim()) {
        toast.error("Please enter room code and your name");
        return;
      }
      console.log("Joining room:", roomCode);
      connectSocket(roomCode, playerName, false);
    } catch (error: any) {
      console.error("Join room error:", error);
      toast.error(error.message || "Failed to join room");
    }
  };

  const startOnlineGame = async () => {
    try {
      if (!isHost || connectedPlayers.length < 2) {
        toast.error("Need at least 2 players to start");
        return;
      }

      console.log("Starting online game");
      if (socketRef.current) {
        socketRef.current.emit("startGame", { roomCode });
        await call("startGame", roomCode);
      }
    } catch (error: any) {
      console.error("Start game error:", error);
      toast.error(error.message || "Failed to start game");
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim() || !socketRef.current) return;
    console.log("Sending chat:", chatMessage);
    socketRef.current.emit("chat", {
      roomCode,
      playerId: myPlayerId,
      message: chatMessage,
    });
    setChatMessage("");
  };

  // ===============================================
  // COMPUTER GAME FUNCTIONS
  // ===============================================

  const startComputerGame = (piece: string) => {
    const compPiece = AVAILABLE_PIECES.filter((p) => p !== piece)[0];
    console.log("Starting computer game");

    setPlayers([
      {
        id: 0,
        name: "You",
        position: 0,
        money: 1500,
        properties: [],
        color: "bg-blue-600",
        piece,
        isComputer: false,
        isActive: true,
        bankrupt: false,
        inJail: false,
        getOutOfJailFree: 0,
      },
      {
        id: 1,
        name: "AI",
        position: 0,
        money: 1500,
        properties: [],
        color: "bg-red-600",
        piece: compPiece,
        isComputer: true,
        isActive: true,
        bankrupt: false,
        inJail: false,
        getOutOfJailFree: 0,
      },
    ]);

    setGameStarted(true);
    setGameMode("computer");
    setCurrentPlayer(0);
    setCanRoll(true);
    setMessage("Your turn!");
    addLog("Game started!");
  };

  useEffect(() => {
    if (
      gameStarted &&
      gameMode === "computer" &&
      players[currentPlayer]?.isComputer &&
      canRoll &&
      !showBuyModal &&
      !winner
    ) {
      setTimeout(rollDice, 1500);
    }
  }, [currentPlayer, canRoll, showBuyModal, gameStarted, gameMode, winner]);

  const computerDecision = (prop: Property) => {
    setTimeout(() => {
      const afford = (players[1].money - prop.price) / players[1].money;
      const buy =
        players[1].money >= prop.price &&
        (prop.price < 150
          ? Math.random() > 0.2
          : afford > 0.5
          ? Math.random() > 0.3
          : afford > 0.3
          ? Math.random() > 0.5
          : Math.random() > 0.7);
      setTimeout(() => (buy ? buyProperty(prop) : skipProperty()), 800);
    }, 500);
  };

  // ===============================================
  // GAME ACTION FUNCTIONS
  // ===============================================

  const handleChanceCard = (player: Player, playerIndex: number) => {
    const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
    setCurrentCard(card);
    setShowCardModal(true);

    setTimeout(() => {
      const newPlayers = [...players];

      switch (card.type) {
        case "money":
          newPlayers[playerIndex].money += card.amount!;
          addLog(
            `${player.name} ${
              card.amount! > 0 ? "received" : "paid"
            } $${Math.abs(card.amount!)}`
          );
          playSound("money");
          break;
        case "move":
          if (card.position !== undefined) {
            newPlayers[playerIndex].position = card.position;
            if (card.position === 0) {
              newPlayers[playerIndex].money += 200;
              addLog(`${player.name} advanced to GO!`);
              playSound("money");
            }
          }
          break;
        case "jail":
          newPlayers[playerIndex].position = 10;
          newPlayers[playerIndex].inJail = true;
          setJailTurns({ ...jailTurns, [playerIndex]: 0 });
          addLog(`${player.name} went to Jail!`);
          playSound("jail");
          break;
        case "jail_free":
          newPlayers[playerIndex].getOutOfJailFree =
            (newPlayers[playerIndex].getOutOfJailFree || 0) + 1;
          addLog(`${player.name} got a Get Out of Jail Free card!`);
          break;
      }

      setPlayers(newPlayers);
      setShowCardModal(false);
      setCurrentCard(null);
    }, 3000);
  };

  const handleCommunityChest = (player: Player, playerIndex: number) => {
    const card =
      COMMUNITY_CHEST_CARDS[
        Math.floor(Math.random() * COMMUNITY_CHEST_CARDS.length)
      ];
    setCurrentCard(card);
    setShowCardModal(true);

    setTimeout(() => {
      const newPlayers = [...players];

      if (card.type === "money") {
        newPlayers[playerIndex].money += card.amount!;
        addLog(
          `${player.name} ${card.amount! > 0 ? "received" : "paid"} ${Math.abs(
            card.amount!
          )}`
        );
        playSound("money");
      } else if (card.type === "jail_free") {
        newPlayers[playerIndex].getOutOfJailFree =
          (newPlayers[playerIndex].getOutOfJailFree || 0) + 1;
        addLog(`${player.name} got a Get Out of Jail Free card!`);
      }

      setPlayers(newPlayers);
      setShowCardModal(false);
      setCurrentCard(null);
    }, 3000);
  };

  const rollDice = async () => {
    try {
      if (!canRoll || isRolling || winner) return;

      const player = players[currentPlayer];

      // Handle jail - offer options
      if (player.inJail) {
        const turns = jailTurns[currentPlayer] || 0;

        if (player.getOutOfJailFree && player.getOutOfJailFree > 0) {
          const useCard = confirm(
            "Use Get Out of Jail Free card? (Click OK to use, Cancel to roll for doubles)"
          );
          if (useCard) {
            const newPlayers = [...players];
            newPlayers[currentPlayer].inJail = false;
            newPlayers[currentPlayer].getOutOfJailFree! -= 1;
            setPlayers(newPlayers);
            setJailTurns({ ...jailTurns, [currentPlayer]: 0 });
            addLog(`${player.name} used Get Out of Jail Free card!`);
            if (gameMode === "online") {
              await call("useJailFreeCard", roomCode);
            }
            return;
          }
        }

        if (turns >= 2) {
          const payNow = confirm(
            "Last turn in jail! Pay $50 now? (Cancel to roll for doubles)"
          );
          if (payNow) {
            const newPlayers = [...players];
            newPlayers[currentPlayer].inJail = false;
            newPlayers[currentPlayer].money -= 50;
            setPlayers(newPlayers);
            setJailTurns({ ...jailTurns, [currentPlayer]: 0 });
            addLog(`${player.name} paid $50 to get out of jail`);
            playSound("money");
            if (gameMode === "online") {
              await call("payToLeaveJail", roomCode);
            }
            endTurn();
            return;
          }
        }
      }

      playSound("dice");

      if (gameMode === "online") {
        if (currentPlayer !== myPlayerId) return;
        if (socketRef.current) {
          console.log("Emitting rollDice to server");
          socketRef.current.emit("rollDice", {
            roomCode,
            playerId: myPlayerId,
          });
          await call("rollDice", roomCode, 1, 2);
        }
        return;
      }

      // Computer mode - generate dice locally
      setIsRolling(true);
      setCanRoll(false);

      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      setDice([die1, die2]);

      setTimeout(() => {
        const total = die1 + die2;
        const newPlayers = [...players];
        const currentP = newPlayers[currentPlayer];

        // Check jail - doubles get you out
        if (currentP.inJail) {
          if (die1 === die2) {
            currentP.inJail = false;
            setJailTurns({ ...jailTurns, [currentPlayer]: 0 });
            addLog(`${currentP.name} rolled doubles and got out of jail!`);
          } else {
            const newTurns = (jailTurns[currentPlayer] || 0) + 1;
            setJailTurns({ ...jailTurns, [currentPlayer]: newTurns });

            if (newTurns >= 3) {
              currentP.inJail = false;
              currentP.money -= 50;
              setJailTurns({ ...jailTurns, [currentPlayer]: 0 });
              addLog(`${currentP.name} paid $50 to leave jail after 3 turns`);
              playSound("money");
            } else {
              addLog(
                `${currentP.name} didn't roll doubles. ${
                  3 - newTurns
                } turns left in jail.`
              );
              setPlayers(newPlayers);
              setIsRolling(false);
              setTimeout(endTurn, 2000);
              return;
            }
          }
        }

        let newPos = currentP.position + total;

        if (newPos >= 40) {
          currentP.money += 200;
          addLog(`${currentP.name} passed GO! +$200`);
          playSound("money");
          newPos = newPos % 40;
        }

        currentP.position = newPos;
        const prop = gameProperties[newPos];

        if (prop.name === "Go To Jail") {
          currentP.position = 10;
          currentP.inJail = true;
          setJailTurns({ ...jailTurns, [currentPlayer]: 0 });
          addLog(`${currentP.name} to Jail!`);
          playSound("jail");
          setPlayers(newPlayers);
          setIsRolling(false);
          setTimeout(endTurn, 2000);
          return;
        } else if (prop.name === "Income Tax") {
          currentP.money -= 200;
          addLog(`${currentP.name} paid $200 tax`);
          playSound("money");
        } else if (prop.name === "Luxury Tax") {
          currentP.money -= 100;
          addLog(`${currentP.name} paid $100 tax`);
          playSound("money");
        } else if (prop.name === "Chance") {
          handleChanceCard(currentP, currentPlayer);
          setPlayers(newPlayers);
          setIsRolling(false);
          setTimeout(endTurn, 3500);
          return;
        } else if (prop.name === "Community Chest") {
          handleCommunityChest(currentP, currentPlayer);
          setPlayers(newPlayers);
          setIsRolling(false);
          setTimeout(endTurn, 3500);
          return;
        } else if (prop.price > 0) {
          if (prop.owner === null) {
            setCurrentProperty(prop);
            setShowBuyModal(true);
            if (currentP.isComputer) computerDecision(prop);
            setPlayers(newPlayers);
            setIsRolling(false);
            return;
          } else if (prop.owner !== currentPlayer && !prop.mortgaged) {
            const rent = prop.rent[prop.houses];
            currentP.money -= rent;
            newPlayers[prop.owner].money += rent;
            addLog(
              `${currentP.name} paid ${rent} rent to ${
                newPlayers[prop.owner].name
              }`
            );
            playSound("money");
            if (prop.houses > 0) {
              const buildingType =
                prop.houses === 5
                  ? "hotel"
                  : `${prop.houses} house${prop.houses > 1 ? "s" : ""}`;
              addLog(`Property has ${buildingType}`);
            }
          }
        }

        setPlayers(newPlayers);
        setIsRolling(false);
        setTimeout(endTurn, 2000);
      }, 1000);
    } catch (error: any) {
      console.error("Roll dice error:", error);
      toast.error("err here" + error.message || "Failed to roll dice");
      setIsRolling(false);
    }
  };

  const buyProperty = async (prop: Property) => {
    try {
      if (!prop) return;

      if (gameMode === "online") {
        console.log("Buying property online:", prop.position);
        if (socketRef.current) {
          socketRef.current.emit("buyProperty", {
            roomCode,
            propertyPosition: prop.position,
            playerId: myPlayerId,
          });
          await call("buyProperty", roomCode, prop.position);
        }
        return;
      }

      const newPlayers = [...players];
      const player = newPlayers[currentPlayer];

      if (player.money >= prop.price) {
        player.money -= prop.price;
        player.properties.push(prop.position);

        const newProps = [...gameProperties];
        newProps[prop.position].owner = currentPlayer;
        setGameProperties(newProps);

        addLog(`${player.name} bought ${prop.name}`);
        setPlayers(newPlayers);
        playSound("buy");
      }

      setShowBuyModal(false);
      setCurrentProperty(null);

      if (gameMode === "computer") {
        setTimeout(endTurn, 1500);
      }
    } catch (error: any) {
      console.error("Buy property error:", error);
      toast.error(error.message || "Failed to buy property");
    }
  };

  const skipProperty = () => {
    console.log("Skipping property");

    if (gameMode === "online") {
      if (socketRef.current) {
        socketRef.current.emit("skipProperty", {
          roomCode,
          playerId: myPlayerId,
        });
      }
      return;
    }

    setShowBuyModal(false);
    setCurrentProperty(null);

    if (gameMode === "computer") {
      setTimeout(endTurn, 1500);
    }
  };

  const buyHouse = async (propertyIndex: number) => {
    try {
      const prop = gameProperties[propertyIndex];
      if (!prop || prop.type !== "property" || !prop.housePrice) return;

      if (gameMode === "online") {
        console.log("Buying house online:", propertyIndex);
        if (socketRef.current) {
          socketRef.current.emit("buyHouse", {
            roomCode,
            propertyPosition: propertyIndex,
            playerId: myPlayerId,
          });
          await call("buyHouse", roomCode, propertyIndex);
        }
        return;
      }

      const player = players[currentPlayer];
      if (prop.owner !== currentPlayer) return;
      if (!ownsMonopoly(currentPlayer, prop.color)) {
        setMessage("Need monopoly to build!");
        addLog("Need all properties of this color");
        toast.error("Need complete color set to build!");
        return;
      }
      if (prop.houses >= 5) {
        setMessage("Already has hotel!");
        toast.error("Already has hotel!");
        return;
      }
      if (prop.mortgaged) {
        setMessage("Cannot build on mortgaged property!");
        toast.error("Cannot build on mortgaged property!");
        return;
      }
      if (player.money < prop.housePrice) {
        setMessage("Not enough money!");
        toast.error("Not enough money!");
        return;
      }

      const newPlayers = [...players];
      newPlayers[currentPlayer].money -= prop.housePrice;
      setPlayers(newPlayers);

      const newProps = [...gameProperties];
      newProps[propertyIndex].houses += 1;
      setGameProperties(newProps);

      const buildingName =
        newProps[propertyIndex].houses === 5 ? "hotel" : "house";
      addLog(`Built ${buildingName} on ${prop.name}`);
      setMessage(`Built ${buildingName}!`);
      playSound("buy");
      toast.success(`Built ${buildingName} on ${prop.name}!`);
    } catch (error: any) {
      console.error("Buy house error:", error);
      toast.error(error.message || "Failed to buy house");
    }
  };

  const sellHouse = async (propertyIndex: number) => {
    try {
      const prop = gameProperties[propertyIndex];
      if (!prop || prop.type !== "property" || !prop.housePrice) return;

      if (gameMode === "online") {
        console.log("Selling house online:", propertyIndex);
        if (socketRef.current) {
          socketRef.current.emit("sellHouse", {
            roomCode,
            propertyPosition: propertyIndex,
            playerId: myPlayerId,
          });
          await call("sellHouse", roomCode, propertyIndex);
        }
        return;
      }

      if (prop.owner !== currentPlayer) return;
      if (prop.houses === 0) return;

      const newPlayers = [...players];
      newPlayers[currentPlayer].money += Math.floor(prop.housePrice / 2);
      setPlayers(newPlayers);

      const newProps = [...gameProperties];
      const wasHotel = newProps[propertyIndex].houses === 5;
      newProps[propertyIndex].houses -= 1;
      setGameProperties(newProps);

      const buildingName = wasHotel ? "hotel" : "house";
      addLog(`Sold ${buildingName} on ${prop.name}`);
      setMessage(`Sold ${buildingName}!`);
      playSound("money");
      toast.success(
        `Sold ${buildingName} for ${Math.floor(prop.housePrice / 2)}`
      );
    } catch (error: any) {
      console.error("Sell house error:", error);
      toast.error(error.message || "Failed to sell house");
    }
  };

  const mortgageProperty = async (propertyIndex: number) => {
    try {
      const prop = gameProperties[propertyIndex];
      if (!prop || prop.owner !== currentPlayer || prop.mortgaged) return;
      if (prop.houses > 0) {
        toast.error("Sell all buildings first!");
        return;
      }

      if (gameMode === "online") {
        console.log("Mortgaging property online:", propertyIndex);
        if (socketRef.current) {
          socketRef.current.emit("mortgageProperty", {
            roomCode,
            propertyPosition: propertyIndex,
            playerId: myPlayerId,
          });
          await call("mortgageProperty", roomCode, propertyIndex);
        }
        return;
      }

      const newPlayers = [...players];
      const mortgageValue = Math.floor(prop.price / 2);
      newPlayers[currentPlayer].money += mortgageValue;
      setPlayers(newPlayers);

      const newProps = [...gameProperties];
      newProps[propertyIndex].mortgaged = true;
      setGameProperties(newProps);

      addLog(`Mortgaged ${prop.name} for ${mortgageValue}`);
      playSound("money");
      toast.success(`Mortgaged ${prop.name} for ${mortgageValue}`);
    } catch (error: any) {
      console.error("Mortgage error:", error);
      toast.error(error.message || "Failed to mortgage property");
    }
  };

  const unmortgageProperty = async (propertyIndex: number) => {
    try {
      const prop = gameProperties[propertyIndex];
      if (!prop || prop.owner !== currentPlayer || !prop.mortgaged) return;

      const cost = Math.floor(prop.price * 0.55);

      if (gameMode === "online") {
        console.log("Unmortgaging property online:", propertyIndex);
        if (socketRef.current) {
          socketRef.current.emit("unmortgageProperty", {
            roomCode,
            propertyPosition: propertyIndex,
            playerId: myPlayerId,
          });
          await call("unmortgageProperty", roomCode, propertyIndex);
        }
        return;
      }

      if (players[currentPlayer].money < cost) {
        toast.error("Not enough money to unmortgage!");
        return;
      }

      const newPlayers = [...players];
      newPlayers[currentPlayer].money -= cost;
      setPlayers(newPlayers);

      const newProps = [...gameProperties];
      newProps[propertyIndex].mortgaged = false;
      setGameProperties(newProps);

      addLog(`Unmortgaged ${prop.name} for ${cost}`);
      playSound("buy");
      toast.success(`Unmortgaged ${prop.name} for ${cost}`);
    } catch (error: any) {
      console.error("Unmortgage error:", error);
      toast.error(error.message || "Failed to unmortgage property");
    }
  };

  // ===============================================
  // COMPONENT RENDER - Complete Return Statement
  // ===============================================

  // Inside export default function App() { ... }
  // After all the functions, add this return:

  return (
    <>
      {/* =============================================== */}
      {/* SPLASH SCREEN */}
      {/* =============================================== */}
      {showSplash && (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0QzFENzkiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTEwIDBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

          <div className="text-center z-10 animate-pulse">
            <div className="mb-8 relative">
              <Sparkles className="w-24 h-24 mx-auto text-yellow-400 animate-spin-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2 className="w-12 h-12 text-purple-400" />
              </div>
            </div>

            <h1
              className="text-7xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-transparent bg-clip-text"
              style={{
                fontFamily: "'Press Start 2P', 'Orbitron', cursive, monospace",
              }}
            >
              STARKCITY
            </h1>

            <p
              className="text-2xl uppercase font-bold text-purple-300 mb-8"
              style={{ fontFamily: "'Bangers', cursive" }}
            >
              Own the blockchain streets.
            </p>

            <div className="flex gap-2 justify-center">
              <div
                className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="w-3 h-3 bg-pink-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================== */}
      {/* MAIN MENU */}
      {/* =============================================== */}
      {!showSplash && gameMode === "menu" && (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkZGRkYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djEyaC0yVjM0aDJ6bTAtMTB2OGgtMnYtOGgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>

          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-4 border-yellow-400 relative z-10">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 rounded-full border-4 border-gray-900">
              <Sparkles className="w-6 h-6 text-white inline" />
            </div>

            <h1
              className="text-5xl sm:text-6xl font-black text-center mb-3 bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-500 text-transparent bg-clip-text"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              STARKCITY
            </h1>
            <p
              className="text-center text-yellow-200 mb-8 text-xl font-bold tracking-wider"
              style={{ fontFamily: "'Bangers', cursive" }}
            >
              🏙️ BUILD • TRADE • CONQUER 🏙️
            </p>

            <div className="space-y-4">
              <button
                onClick={() => enterGame("computer")}
                className="group w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg border-4 border-blue-800 hover:border-cyan-400 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative flex items-center justify-center gap-4">
                  <Cpu className="w-10 h-10" />
                  <div className="text-left">
                    <div
                      className="text-2xl font-black"
                      style={{ fontFamily: "'Bangers', cursive" }}
                    >
                      vs COMPUTER
                    </div>
                    <div className="text-sm opacity-90 font-bold">
                      Challenge the AI Boss!
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => enterGame("online")}
                className="group w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg border-4 border-green-800 hover:border-emerald-400 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative flex items-center justify-center gap-4">
                  <Users className="w-10 h-10" />
                  <div className="text-left">
                    <div
                      className="text-2xl font-black"
                      style={{ fontFamily: "'Bangers', cursive" }}
                    >
                      ONLINE
                    </div>
                    <div className="text-sm opacity-90 font-bold">
                      Battle with Friends!
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowRules(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white p-4 rounded-xl transition-all transform hover:scale-105 shadow-lg border-4 border-purple-800 hover:border-pink-400 flex items-center justify-center gap-3"
              >
                <Info className="w-6 h-6" />
                <span
                  className="text-xl font-black"
                  style={{ fontFamily: "'Bangers', cursive" }}
                >
                  HOW TO PLAY
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================== */}
      {/* ONLINE LOBBY */}
      {/* =============================================== */}
      {!showSplash && gameMode === "online" && !gameStarted && (
        <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-900 to-blue-900 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-4 border-cyan-400">
            <button
              onClick={() => {
                setGameMode("menu");
                if (socketRef.current) socketRef.current.disconnect();
              }}
              className="mb-4 text-cyan-400 hover:text-cyan-300 font-black text-lg"
              style={{ fontFamily: "'Bangers', cursive" }}
            >
              ← BACK
            </button>

            <h1
              className="text-4xl font-black text-center mb-2 text-cyan-400"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              ONLINE MODE
            </h1>
            <p className="text-center text-cyan-200 mb-8 font-bold">
              {message}
            </p>

            {!roomCode || roomCode.length !== 6 ? (
              <div className="space-y-6">
                <div>
                  <label
                    className="block text-sm font-black mb-2 text-yellow-400"
                    style={{ fontFamily: "'Bangers', cursive" }}
                  >
                    YOUR NAME
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border-4 border-cyan-500 rounded-lg focus:border-yellow-400 focus:outline-none bg-gray-800 text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={createRoom}
                    disabled={!playerName || creatingRoom}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-black py-4 rounded-lg border-4 border-purple-800 hover:border-pink-400 disabled:border-gray-800"
                    style={{ fontFamily: "'Bangers', cursive" }}
                  >
                    {creatingRoom ? "Creating..." : "CREATE ROOM"}
                  </button>

                  <button
                    onClick={() => setShowJoinInput(!showJoinInput)}
                    disabled={!playerName || creatingRoom}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-black py-4 rounded-lg border-4 border-blue-800 hover:border-cyan-400 disabled:border-gray-800"
                    style={{ fontFamily: "'Bangers', cursive" }}
                  >
                    JOIN ROOM
                  </button>
                </div>

                {showJoinInput && playerName && (
                  <div>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => {
                        setRoomCode(e.target.value.toUpperCase());
                        if (e.target.value.trim().length == 6) {
                          joinRoom(e.target.value.trim().toUpperCase());
                        }
                      }}
                      placeholder="Enter room code"
                      className="w-full px-4 py-3 border-4 border-cyan-500 rounded-lg uppercase mb-4 bg-gray-800 text-white font-bold tracking-widest text-center text-2xl"
                      maxLength={6}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 border-4 border-yellow-600 rounded-lg p-6 text-center">
                  <p className="text-sm font-black mb-2 text-gray-900">
                    ROOM CODE
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <p
                      className="text-5xl font-black text-gray-900 tracking-widest"
                      style={{ fontFamily: "'Press Start 2P', cursive" }}
                    >
                      {roomCode}
                    </p>
                    <button
                      onClick={copyRoomCode}
                      className="p-2 hover:bg-yellow-300 rounded-lg"
                    >
                      {copied ? (
                        <Check className="w-8 h-8 text-green-700" />
                      ) : (
                        <Copy className="w-8 h-8 text-gray-900" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3
                    className="font-black mb-3 text-yellow-400 text-xl"
                    style={{ fontFamily: "'Bangers', cursive" }}
                  >
                    PLAYERS ({connectedPlayers.length}/4)
                  </h3>
                  <div className="space-y-2">
                    {connectedPlayers.map((p: any, i: number) => (
                      <div
                        key={i}
                        className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-lg flex items-center gap-3 border-2 border-cyan-600"
                      >
                        <div
                          className={`w-12 h-12 ${p.color} rounded-full flex items-center justify-center text-3xl border-4 border-white`}
                        >
                          {p.piece}
                        </div>
                        <span className="font-black text-white text-xl">
                          {p.name}
                        </span>
                        {i === 0 && (
                          <span className="ml-auto text-xs bg-yellow-400 text-gray-900 px-3 py-1 rounded font-black">
                            HOST
                          </span>
                        )}
                        {p.id === myPlayerId && (
                          <span className="ml-auto text-xs bg-cyan-400 text-gray-900 px-3 py-1 rounded font-black">
                            YOU
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isHost && connectedPlayers.length >= 2 && (
                  <button
                    onClick={startOnlineGame}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black py-4 rounded-lg flex items-center justify-center gap-3 border-4 border-green-700 text-xl"
                    style={{ fontFamily: "'Bangers', cursive" }}
                  >
                    <Play className="w-8 h-8" />
                    START GAME!
                  </button>
                )}

                {!isHost && (
                  <div className="bg-yellow-400 border-4 border-yellow-600 rounded-lg p-4 text-center">
                    <p
                      className="text-gray-900 font-black text-lg"
                      style={{ fontFamily: "'Bangers', cursive" }}
                    >
                      WAITING FOR HOST...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================================== */}
      {/* COMPUTER MODE - PIECE SELECTION */}
      {/* =============================================== */}
      {!showSplash && gameMode === "computer" && !gameStarted && (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-4 border-pink-500">
            <button
              onClick={() => setGameMode("menu")}
              className="mb-4 text-pink-400 hover:text-pink-300 font-black text-lg"
              style={{ fontFamily: "'Bangers', cursive" }}
            >
              ← BACK
            </button>

            <h1
              className="text-4xl font-black text-center mb-8 text-pink-400"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              CHOOSE YOUR PIECE
            </h1>
            <div className="grid grid-cols-4 gap-4">
              {AVAILABLE_PIECES.map((piece) => (
                <button
                  key={piece}
                  onClick={() => startComputerGame(piece)}
                  className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white p-8 rounded-2xl text-6xl transition-all transform hover:scale-110 shadow-lg border-4 border-purple-800 hover:border-pink-400"
                >
                  {piece}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =============================================== */}
      {/* GAME BOARD */}
      {/* =============================================== */}
      {!showSplash && gameStarted && (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4">
          <div className="max-w-7xl mx-auto">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between mb-2 sm:mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl border-4 border-yellow-600 shadow-lg">
              <h1
                className="text-2xl sm:text-4xl font-black text-gray-900"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                STARKCITY
              </h1>
              <div className="flex gap-2">
                {gameMode === "online" && roomCode && (
                  <div className="bg-gray-900 text-yellow-400 px-3 py-1 rounded-lg font-black text-xs sm:text-sm border-2 border-yellow-400">
                    {roomCode}
                  </div>
                )}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`${
                    soundEnabled ? "bg-green-500" : "bg-gray-500"
                  } text-white px-2 py-1 rounded-lg font-black flex items-center gap-1`}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowManageProperties(!showManageProperties)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-black flex items-center gap-1 border-2 border-green-700 shadow-lg"
                  style={{ fontFamily: "'Bangers', cursive" }}
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">BUILD</span>
                </button>
                <button
                  onClick={() => setShowProperties(!showProperties)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-black flex items-center gap-1 border-2 border-blue-700 shadow-lg"
                  style={{ fontFamily: "'Bangers', cursive" }}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">PROPS</span>
                </button>
                {gameMode === "online" && (
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-black flex items-center gap-1 border-2 border-purple-700 shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Main Game Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
              {/* Game Board */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-1 sm:p-2 rounded-lg shadow-2xl border-4 border-yellow-500">
                  {/* Top Row */}
                  <div className="grid grid-cols-11 gap-0">
                    {[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((pos) => (
                      <div key={pos} className="col-span-1 aspect-square">
                        <PropertySpace
                          prop={gameProperties[pos]}
                          players={players}
                          onClick={() =>
                            setShowPropertyDetails(gameProperties[pos])
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Middle Section */}
                  <div className="grid grid-cols-11 gap-0">
                    {/* Left Column */}
                    <div className="col-span-1 grid grid-rows-9 gap-0">
                      {[19, 18, 17, 16, 15, 14, 13, 12, 11].map((pos) => (
                        <div key={pos} className="aspect-square">
                          <PropertySpace
                            prop={gameProperties[pos]}
                            players={players}
                            onClick={() =>
                              setShowPropertyDetails(gameProperties[pos])
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* Center Board */}
                    <div className="col-span-9 bg-gradient-to-br from-purple-800 via-pink-700 to-purple-800 flex flex-col items-center justify-center p-2 sm:p-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkZGRkYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djEyaC0yVjM0aDJ6bTAtMTB2OGgtMnYtOGgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

                      <div className="relative z-10">
                        <div
                          className="text-4xl sm:text-7xl font-black text-yellow-400 mb-1 sm:mb-2 drop-shadow-lg"
                          style={{ fontFamily: "'Press Start 2P', cursive" }}
                        >
                          S
                        </div>
                        <div
                          className="text-xl sm:text-4xl font-black text-yellow-300 mb-2 sm:mb-6 tracking-wider"
                          style={{ fontFamily: "'Bangers', cursive" }}
                        >
                          STARKCITY
                        </div>

                        {winner ? (
                          <div className="text-center">
                            <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-4 animate-bounce" />
                            <div className="text-4xl font-black text-yellow-400 mb-2">
                              🎉 {winner.name} WINS! 🎉
                            </div>
                            <button
                              onClick={() => window.location.reload()}
                              className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-black flex items-center gap-2 mx-auto"
                            >
                              <RefreshCw className="w-5 h-5" />
                              NEW GAME
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Dice */}
                            <div className="flex gap-2 sm:gap-4 mb-2 sm:mb-4">
                              {dice.map((d, i) => (
                                <div
                                  key={i}
                                  className={`bg-white p-2 sm:p-4 rounded-xl shadow-2xl border-4 border-yellow-400 transform transition-transform ${
                                    isRolling
                                      ? "animate-bounce"
                                      : "hover:scale-110"
                                  }`}
                                >
                                  <DiceIcon value={d} />
                                </div>
                              ))}
                            </div>

                            {/* Turn Timer */}
                            {turnTimer > 0 && canRoll && !showBuyModal && (
                              <div className="mb-4">
                                <div className="text-white text-2xl font-black mb-2">
                                  {turnTimer}s
                                </div>
                                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-400 to-yellow-400 transition-all duration-1000"
                                    style={{
                                      width: `${(turnTimer / 30) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* Roll Button */}
                            <button
                              onClick={rollDice}
                              disabled={
                                !canRoll ||
                                isRolling ||
                                showBuyModal ||
                                (gameMode === "computer" &&
                                  players[currentPlayer]?.isComputer) ||
                                (gameMode === "online" &&
                                  currentPlayer !== myPlayerId)
                              }
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 text-gray-900 font-black py-2 px-4 sm:py-4 sm:px-8 rounded-full text-sm sm:text-2xl shadow-2xl transition-all transform hover:scale-110 disabled:scale-100 border-4 border-yellow-600 disabled:border-gray-800"
                              style={{ fontFamily: "'Bangers', cursive" }}
                            >
                              {isRolling ? "ROLLING..." : "ROLL DICE!"}
                            </button>

                            {/* Message */}
                            <div className="text-white text-xs sm:text-lg text-center bg-gray-900 px-2 py-1 sm:px-4 sm:py-2 rounded-lg mt-2 sm:mt-4 max-w-md font-bold border-2 border-yellow-400">
                              {message}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-1 grid grid-rows-9 gap-0">
                      {[31, 32, 33, 34, 35, 36, 37, 38, 39].map((pos) => (
                        <div key={pos} className="aspect-square">
                          <PropertySpace
                            prop={gameProperties[pos]}
                            players={players}
                            onClick={() =>
                              setShowPropertyDetails(gameProperties[pos])
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="grid grid-cols-11 gap-0">
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((pos) => (
                      <div key={pos} className="col-span-1 aspect-square">
                        <PropertySpace
                          prop={gameProperties[pos]}
                          players={players}
                          onClick={() =>
                            setShowPropertyDetails(gameProperties[pos])
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar - Players & Log */}
              <div className="space-y-2 sm:space-y-4 mt-4 lg:mt-0">
                {/* Player Cards */}
                {players.map((player, idx) => (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 shadow-lg border-4 ${
                      idx === currentPlayer
                        ? "border-yellow-400 ring-4 ring-yellow-300"
                        : player.bankrupt
                        ? "border-red-600 opacity-50"
                        : "border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-3xl sm:text-4xl">
                          {player.piece}
                        </div>
                        <div>
                          <span
                            className="font-black text-base sm:text-xl text-white"
                            style={{ fontFamily: "'Bangers', cursive" }}
                          >
                            {player.name}
                          </span>
                          {player.inJail && (
                            <div className="text-xs text-red-400 font-bold">
                              🔒 IN JAIL
                            </div>
                          )}
                          {player.bankrupt && (
                            <div className="text-xs text-red-500 font-bold">
                              💀 BANKRUPT
                            </div>
                          )}
                        </div>
                      </div>
                      {idx === currentPlayer && !player.bankrupt && (
                        <span className="text-xs sm:text-sm bg-yellow-400 text-gray-900 px-2 py-1 rounded font-black animate-pulse">
                          TURN
                        </span>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-2 text-green-400 font-black text-lg sm:text-2xl"
                      style={{ fontFamily: "'Press Start 2P', cursive" }}
                    >
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                      {player.money}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 mt-1 font-bold">
                      Properties: {player.properties.length}
                      {player.getOutOfJailFree
                        ? ` | 🎫 ${player.getOutOfJailFree}`
                        : ""}
                    </div>
                  </div>
                ))}

                {/* Game Log */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 shadow-lg border-4 border-cyan-500">
                  <h3
                    className="font-black mb-2 text-sm sm:text-base text-cyan-400"
                    style={{ fontFamily: "'Bangers', cursive" }}
                  >
                    GAME LOG
                  </h3>
                  <div className="space-y-1 text-xs sm:text-sm max-h-32 sm:max-h-40 overflow-y-auto">
                    {gameLog.map((log, idx) => (
                      <div key={idx} className="text-gray-300 font-bold">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================== */}
      {/* MODALS */}
      {/* =============================================== */}

      {/* Buy Property Modal */}
      {showBuyModal && currentProperty && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl border-4 border-yellow-400 transform scale-110">
            <h2
              className="text-2xl sm:text-3xl font-black mb-4 text-yellow-400"
              style={{ fontFamily: "'Bangers', cursive" }}
            >
              {currentProperty.name}
            </h2>
            <p className="text-base sm:text-xl mb-2 font-black text-white">
              Price: ${currentProperty.price}
            </p>
            <p className="text-sm sm:text-base text-gray-400 mb-4 font-bold">
              Rent: ${currentProperty.rent[0]}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 font-bold">
              Your Money: ${players[currentPlayer]?.money || 0}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => buyProperty(currentProperty)}
                disabled={players[currentPlayer]?.money < currentProperty.price}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-black py-2 sm:py-3 rounded-lg border-4 border-green-700 disabled:border-gray-800"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                BUY IT!
              </button>
              <button
                onClick={skipProperty}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-black py-2 sm:py-3 rounded-lg border-4 border-red-800"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                SKIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Modal */}
      {showCardModal && currentCard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-8 max-w-md w-full shadow-2xl border-4 border-yellow-400 animate-bounce">
            <h2
              className="text-3xl font-black mb-4 text-white text-center"
              style={{ fontFamily: "'Bangers', cursive" }}
            >
              {currentCard.title}
            </h2>
            <p className="text-xl text-white text-center font-bold mb-4">
              {currentCard.description}
            </p>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {showPropertyDetails && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full shadow-2xl border-4 border-cyan-400">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-2xl font-black text-cyan-400"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                {showPropertyDetails.name}
              </h2>
              <button
                onClick={() => setShowPropertyDetails(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {showPropertyDetails.price > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-black">
                    ${showPropertyDetails.price}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rent:</span>
                  <span className="text-white font-black">
                    ${showPropertyDetails.rent[0]}
                  </span>
                </div>
                {showPropertyDetails.type === "property" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">With 1 House:</span>
                      <span className="text-white font-black">
                        ${showPropertyDetails.rent[1]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">With 2 Houses:</span>
                      <span className="text-white font-black">
                        ${showPropertyDetails.rent[2]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">With 3 Houses:</span>
                      <span className="text-white font-black">
                        ${showPropertyDetails.rent[3]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">With 4 Houses:</span>
                      <span className="text-white font-black">
                        ${showPropertyDetails.rent[4]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">With Hotel:</span>
                      <span className="text-white font-black">
                        ${showPropertyDetails.rent[5]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">House Cost:</span>
                      <span className="text-white font-black">
                        ${showPropertyDetails.housePrice}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mortgage Value:</span>
                      <span className="text-white font-black">
                        ${Math.floor(showPropertyDetails.price / 2)}
                      </span>
                    </div>
                  </>
                )}
                {showPropertyDetails.owner !== null && (
                  <div className="mt-4 p-3 bg-green-900 rounded-lg border-2 border-green-500">
                    <div className="text-green-400 font-black text-center">
                      Owned by {players[showPropertyDetails.owner]?.name}
                    </div>
                  </div>
                )}
                {showPropertyDetails.mortgaged && (
                  <div className="mt-2 p-3 bg-red-900 rounded-lg border-2 border-red-500">
                    <div className="text-red-400 font-black text-center">
                      MORTGAGED
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Properties Modal */}
      {showManageProperties && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border-4 border-green-500">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-2xl sm:text-4xl font-black text-green-400"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                BUILD EMPIRE
              </h2>
              <button
                onClick={() => setShowManageProperties(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {(gameMode === "online"
                ? gameProperties.filter(
                    (p) => p.owner === myPlayerId && p.type === "property"
                  )
                : gameProperties.filter(
                    (p) => p.owner === currentPlayer && p.type === "property"
                  )
              ).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">
                    You don't own any properties yet!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {(gameMode === "online"
                    ? gameProperties.filter(
                        (p) => p.owner === myPlayerId && p.type === "property"
                      )
                    : gameProperties.filter(
                        (p) =>
                          p.owner === currentPlayer && p.type === "property"
                      )
                  ).map((prop) => {
                    const currentOwnerId =
                      gameMode === "online" ? myPlayerId : currentPlayer;
                    const hasMonopoly = ownsMonopoly(
                      currentOwnerId,
                      prop.color
                    );
                    const currentPlayerData =
                      gameMode === "online"
                        ? players.find((p) => p.id === myPlayerId)
                        : players[currentPlayer];
                    const canBuyHouse =
                      hasMonopoly &&
                      prop.houses < 5 &&
                      !prop.mortgaged &&
                      currentPlayerData &&
                      currentPlayerData.money >= (prop.housePrice || 0);
                    const canSellHouse = prop.houses > 0;

                    return (
                      <div
                        key={prop.position}
                        className="border-4 rounded-xl p-3 sm:p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-cyan-500"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div
                              className={`${prop.color} text-white px-3 py-1 rounded text-xs font-black mb-2 inline-block border-2 border-white`}
                            >
                              {prop.name}
                            </div>
                            <div className="text-xs text-gray-400 font-bold">
                              Base Rent: ${prop.rent[0]}
                            </div>
                            {prop.houses > 0 && (
                              <div className="text-sm font-black text-green-400 mt-1">
                                Current Rent: ${prop.rent[prop.houses]}
                              </div>
                            )}
                            {prop.mortgaged && (
                              <div className="text-sm font-black text-red-400 mt-1">
                                🔒 MORTGAGED
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="text-sm font-black text-yellow-400"
                              style={{ fontFamily: "'Bangers', cursive" }}
                            >
                              Buildings:
                            </span>
                            {prop.houses === 0 && (
                              <span className="text-sm text-gray-500 font-bold">
                                None
                              </span>
                            )}
                            {prop.houses > 0 && prop.houses < 5 && (
                              <div className="flex gap-1">
                                {Array.from({ length: prop.houses }).map(
                                  (_, i) => (
                                    <span key={i} className="text-xl">
                                      🏠
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                            {prop.houses === 5 && (
                              <div className="flex items-center gap-1">
                                <span className="text-3xl animate-bounce">
                                  🏨
                                </span>
                                <span
                                  className="text-sm font-black text-red-500"
                                  style={{ fontFamily: "'Bangers', cursive" }}
                                >
                                  HOTEL!
                                </span>
                              </div>
                            )}
                          </div>
                          {!hasMonopoly && !prop.mortgaged && (
                            <div className="text-xs text-orange-400 bg-orange-900 px-2 py-1 rounded font-bold border-2 border-orange-600">
                              ⚠️ Need complete color set!
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => buyHouse(prop.position)}
                            disabled={!canBuyHouse}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-black py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all border-2 border-green-700 disabled:border-gray-700"
                            style={{ fontFamily: "'Bangers', cursive" }}
                          >
                            <Home className="w-4 h-4" />
                            {prop.houses === 4 ? "HOTEL" : "HOUSE"} $
                            {prop.housePrice}
                          </button>
                          <button
                            onClick={() => sellHouse(prop.position)}
                            disabled={!canSellHouse}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-black py-2 rounded-lg text-sm transition-all border-2 border-orange-700 disabled:border-gray-700"
                            style={{ fontFamily: "'Bangers', cursive" }}
                          >
                            SELL ${Math.floor((prop.housePrice || 0) / 2)}
                          </button>
                          {!prop.mortgaged ? (
                            <button
                              onClick={() => mortgageProperty(prop.position)}
                              disabled={prop.houses > 0}
                              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-black py-2 rounded-lg text-sm transition-all border-2 border-yellow-700 disabled:border-gray-700"
                              style={{ fontFamily: "'Bangers', cursive" }}
                            >
                              MORTGAGE ${Math.floor(prop.price / 2)}
                            </button>
                          ) : (
                            <button
                              onClick={() => unmortgageProperty(prop.position)}
                              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white font-black py-2 rounded-lg text-sm transition-all border-2 border-blue-700"
                              style={{ fontFamily: "'Bangers', cursive" }}
                            >
                              UNMORTGAGE ${Math.floor(prop.price * 0.55)}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Properties Modal */}
      {showProperties && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border-4 border-blue-500">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-2xl sm:text-4xl font-black text-blue-400"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                ALL PROPERTIES
              </h2>
              <button
                onClick={() => setShowProperties(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {gameProperties
                  .filter((p) => p.price > 0)
                  .map((prop) => (
                    <div
                      key={prop.position}
                      className={`border-4 rounded-xl p-3 sm:p-4 ${
                        prop.owner !== null
                          ? "bg-gradient-to-br from-green-900 to-emerald-900 border-green-500"
                          : "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div
                            className={`${
                              prop.color || "bg-gray-600"
                            } text-white px-2 py-1 rounded text-xs font-black mb-1 inline-block border-2 border-white`}
                          >
                            {prop.type.toUpperCase()}
                          </div>
                          <h3
                            className="font-black text-base sm:text-lg text-white"
                            style={{ fontFamily: "'Bangers', cursive" }}
                          >
                            {prop.name}
                          </h3>
                        </div>
                        {prop.owner !== null && players[prop.owner] && (
                          <div className="flex flex-col items-center gap-1 ml-2">
                            <span className="text-3xl">
                              {players[prop.owner].piece}
                            </span>
                            <span className="text-xs font-black text-green-400">
                              {players[prop.owner].name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="font-black text-green-400">
                          ${prop.price}
                        </p>
                        <p className="text-gray-400 font-bold">
                          Base Rent: ${prop.rent[0]}
                        </p>
                        {prop.houses > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className="text-xs font-black text-yellow-400"
                              style={{ fontFamily: "'Bangers', cursive" }}
                            >
                              Buildings:
                            </span>
                            {prop.houses === 5 ? (
                              <div className="flex items-center gap-1">
                                <span className="text-lg">🏨</span>
                                <span className="text-xs font-black text-red-400">
                                  HOTEL
                                </span>
                              </div>
                            ) : (
                              <div className="flex gap-0.5">
                                {Array.from({ length: prop.houses }).map(
                                  (_, i) => (
                                    <span key={i} className="text-sm">
                                      🏠
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {prop.houses > 0 && (
                          <p className="text-sm font-black text-green-400 mt-1">
                            Current Rent: ${prop.rent[prop.houses]}
                          </p>
                        )}
                        {prop.mortgaged && (
                          <p className="text-sm font-black text-red-400 mt-1">
                            🔒 MORTGAGED
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border-4 border-purple-500">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-3xl font-black text-purple-400"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                HOW TO PLAY
              </h2>
              <button
                onClick={() => setShowRules(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="space-y-4 text-white">
              <div>
                <h3 className="text-xl font-black text-yellow-400 mb-2">
                  🎯 OBJECTIVE
                </h3>
                <p className="text-gray-300">
                  Be the last player standing by bankrupting all opponents!
                </p>
              </div>
              <div>
                <h3 className="text-xl font-black text-yellow-400 mb-2">
                  🎲 GAMEPLAY
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Roll dice to move around the board</li>
                  <li>Buy properties you land on</li>
                  <li>Collect rent from other players</li>
                  <li>Build houses and hotels for more rent</li>
                  <li>Pass GO to collect $200</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-black text-yellow-400 mb-2">
                  🏠 BUILDING
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Own ALL properties of a color to build</li>
                  <li>Build up to 4 houses, then 1 hotel</li>
                  <li>Each house increases rent dramatically</li>
                  <li>Sell houses for half price if needed</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-black text-yellow-400 mb-2">
                  💰 MORTGAGE
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Mortgage properties for quick cash (50% value)</li>
                  <li>Unmortgage for 55% of property value</li>
                  <li>Can't collect rent on mortgaged properties</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-black text-yellow-400 mb-2">
                  🔒 JAIL
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Go to jail by landing on "Go To Jail"</li>
                  <li>Pay $50 to get out immediately</li>
                  <li>Roll doubles to escape</li>
                  <li>Use "Get Out of Jail Free" card</li>
                  <li>Forced out after 3 turns (pay $50)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-black text-yellow-400 mb-2">
                  🎴 SPECIAL CARDS
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Chance & Community Chest give random events</li>
                  <li>Can give/take money, move you, or jail you</li>
                  <li>"Get Out of Jail Free" cards can be saved</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-black text-yellow-400 mb-2">
                  💀 BANKRUPTCY
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>If your money goes below $0, you're bankrupt</li>
                  <li>Mortgage or sell houses to stay alive</li>
                  <li>Last player standing wins!</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-black text-yellow-400 mb-2">
                  ⏱️ TURN TIMER
                </h3>
                <p className="text-gray-300">
                  You have 30 seconds per turn. Make it count!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && gameMode === "online" && (
        <div className="fixed bottom-4 right-4 w-80 bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border-4 border-purple-500 z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3
                className="font-black text-purple-400"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                CHAT
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-48 overflow-y-auto mb-3 space-y-2">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="bg-gray-800 p-2 rounded text-sm">
                  <span className="font-black text-cyan-400">
                    {msg.sender}:
                  </span>
                  <span className="text-white ml-2">{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type message..."
                className="flex-1 px-3 py-2 bg-gray-800 border-2 border-purple-500 rounded text-white text-sm"
              />
              <button
                onClick={sendChatMessage}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-black"
              >
                SEND
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ===============================================
// END OF COMPONENT RENDER
// ===============================================
