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
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import {
  AVAILABLE_PIECES,
  PROPERTIES,
  SOCKET_SERVER_URL,
} from "./utils/constants";
import type { Player, Property } from "./utils/interfaces";
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
  const [showSplash, setShowSplash] = useState(true);
  const [gameMode, setGameMode] = useState<"menu" | "computer" | "online">(
    "menu"
  );
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [shouldJoin, setShouldJoin] = useState<null | string>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<number>(0);
  const [showJoinInput, setShowJoinInput] = useState(false);

  // const [selectedPiece, setSelectedPiece] = useState("");
  const [gameProperties, setGameProperties] = useState<Property[]>(PROPERTIES);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [message, setMessage] = useState("Choose your game mode!");
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(false);
  const [showManageProperties, setShowManageProperties] = useState(false);
  // const [turnTimer, setTurnTimer] = useState(20);
  // const timerRef = useRef<any>(null);
  const { call } = useInteraction();

  /// CONNECT WALLET AND ENTER GAME

  async function enterGame(mode: "computer" | "online") {
    try {
      if (!window.Wallet?.IsConnected) {
        await connectAsync({ connector: connectors[0] });
      }
      setGameMode(mode);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    (async function () {
      if (!roomCreated) return;
      if (roomJoined) return;
      if (isHost) {
        if (!shouldJoin) return;
        console.log("JOINING");
        await call("joinGame", shouldJoin, 0);
        setRoomJoined(true);
      }
    })();
  }, [roomCreated]);

  useEffect(() => {
    (async function () {
      try {
        // await disconnectAsync();
        if (showSplash) return;
        if (!account) return;
        if (window.Wallet?.Account) return;
        window.Wallet = {
          Account: account,
          IsConnected: true,
        };
        console.log(window.Wallet);
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

  const addLog = (msg: string) => {
    setGameLog((prev) => [...prev.slice(-4), msg]);
  };

  // Start turn timer for online mode
  // const startTurnTimer = () => {
  //   if (gameMode !== "online") return;

  //   setTurnTimer(20);
  //   if (timerRef.current) {
  //     clearInterval(timerRef.current);
  //   }

  //   timerRef.current = setInterval(() => {
  //     setTurnTimer((prev) => {
  //       if (prev <= 1) {
  //         if (timerRef.current) {
  //           clearInterval(timerRef.current);
  //         }
  //         // Auto skip turn
  //         if (socketRef.current && currentPlayer === myPlayerId && canRoll) {
  //           socketRef.current.emit("skipTurn", {
  //             roomCode,
  //             playerId: myPlayerId,
  //           });
  //         }
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);
  // };

  // Stop turn timer
  // const stopTurnTimer = () => {
  //   if (timerRef.current) {
  //     clearInterval(timerRef.current);
  //     timerRef.current = null;
  //   }
  //   setTurnTimer(20);
  // };

  // Effect to handle turn timer in online mode
  // useEffect(() => {
  //   if (
  //     gameMode === "online" &&
  //     gameStarted &&
  //     currentPlayer === myPlayerId &&
  //     canRoll &&
  //     !showBuyModal
  //   ) {
  //     startTurnTimer();
  //   } else {
  //     stopTurnTimer();
  //   }

  //   return () => {
  //     stopTurnTimer();
  //   };
  // }, [gameMode, gameStarted, currentPlayer, myPlayerId, canRoll, showBuyModal]);

  // Check if player owns all properties of a color group
  const ownsMonopoly = (playerId: number, color: string): boolean => {
    const colorProperties = gameProperties.filter(
      (p) => p.color === color && p.type === "property"
    );
    return colorProperties.every((p) => p.owner === playerId);
  };

  // Buy house or hotel
  const buyHouse = async (propertyIndex: number) => {
    try {
      const prop = gameProperties[propertyIndex];
      if (!prop || prop.type !== "property" || !prop.housePrice) return;

      if (gameMode === "online") {
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
        return;
      }
      if (prop.houses >= 5) {
        setMessage("Already has hotel!");
        return;
      }
      if (player.money < prop.housePrice) {
        setMessage("Not enough money!");
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
    } catch (error: any) {
      toast.error(error.message || "OOPPSS");
    }
  };

  // Sell house or hotel
  const sellHouse = async (propertyIndex: number) => {
    try {
      const prop = gameProperties[propertyIndex];
      if (!prop || prop.type !== "property" || !prop.housePrice) return;

      if (gameMode === "online") {
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

      // const player = players[currentPlayer];
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
    } catch (error: any) {
      toast.error(error.message || "OOPPSS");
    }
  };

  const connectSocket = (room: string, name: string, host: boolean) => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("✅ Connected");
      socket.emit("joinRoom", { room, name, isHost: host });
    });

    socket.on("roomJoined", async (data: any) => {
      try {
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
        addLog(`You joined`);
        setMessage(`Room: ${data.roomCode}`);
        if (!isHost) {
          console.log("NOT HOS JOIN");
          await call("joinGame", data.roomCode, pieceIndex);
        }
      } catch (error: any) {
        toast.error(error.message || "OOPPSS");
      }
    });

    socket.on("playerJoined", (data: any) => {
      setConnectedPlayers(data.players);
      addLog(`${data.playerName} joined`);
    });

    socket.on("gameStarted", (data: any) => {
      setPlayers(data.players);
      setGameStarted(true);
      setCurrentPlayer(data.currentPlayer);
      setCanRoll(data.currentPlayer === myPlayerId);
      setMessage(`${data.players[data.currentPlayer].name}'s turn`);
    });

    socket.on("fullGameState", (state: any) => {
      const myPlayer = state.players.find(
        (fd: any) => fd.socketId.toLowerCase() === socket.id?.toLowerCase()
      );
      if (!myPlayer) {
        return;
      }
      const myPlayerId = myPlayer.id;
      setGameProperties(state.properties);
      setPlayers(state.players);
      setCurrentPlayer(state.currentPlayer);
      setDice(state.dice);
      setGameLog(state.gameLog);
      setGameStarted(state.gameStarted);
      setCanRoll(
        state.currentPlayer === myPlayerId &&
          state.gameStarted &&
          !state.turnInProgress
      );
    });

    socket.on("diceRolled", (data: any) => {
      setDice(data.dice);
      setIsRolling(true);
      setCanRoll(false);
      playDiceSound();
      addLog(`${data.playerName} rolled ${data.dice[0]}+${data.dice[1]}`);
      setTimeout(() => setIsRolling(false), 1000);
    });

    socket.on("playerMoved", (data: any) => {
      const newPlayers = [...players];
      if (newPlayers[data.playerId]) {
        newPlayers[data.playerId].position = data.newPosition;
        newPlayers[data.playerId].money = data.newMoney;
        setPlayers(newPlayers);
        if (data.message) {
          setMessage(data.message);
          addLog(data.message);
        }
      }
    });

    socket.on("propertyLanded", (data: any) => {
      const myPlayer = data.players.find(
        (fd: any) => fd.socketId.toLowerCase() === socket.id?.toLowerCase()
      );
      if (!myPlayer) {
        return;
      }
      const myPlayerId = myPlayer.id;
      if (data.playerId === myPlayerId) {
        const prop = gameProperties[data.propertyPosition];
        setCurrentProperty(prop);
        setShowBuyModal(true);
        setMessage(`Buy ${data.propertyName}?`);
        setCanRoll(false);
      }
    });

    socket.on("propertyPurchased", (data: any) => {
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
    });

    socket.on("propertySkipped", () => {
      setShowBuyModal(false);
      setCurrentProperty(null);
    });

    socket.on("turnChanged", async (data: any) => {
      try {
        console.log({ turnChanged: data, myPlayerId });
        setCurrentPlayer(data.currentPlayer);
        setCanRoll(data.currentPlayer === myPlayerId);
        setMessage(`${data.playerName}'s turn`);
        if (data.currentPlayer === myPlayerId) {
          await call("nextTurn", data.roomCode);
        }
        // stopTurnTimer();
      } catch (error: any) {
        toast.error(error.message || "OOPPSS");
      }
    });

    socket.on("payRent", async (data: any) => {
      try {
        console.log({ rent: data });
        if (data.playerId === myPlayerId) {
          await call("payRent", data.roomCode, data.position);
        }
        // stopTurnTimer();
      } catch (error: any) {
        toast.error(error.message || "OOPPSS");
      }
    });

    socket.on("houseBought", (data: any) => {
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
    });

    socket.on("houseSold", (data: any) => {
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
      setMessage(`${data.playerName} sold ${data.buildingName}!`);
    });

    socket.on("playerLeft", (data: any) => {
      setConnectedPlayers(data.players);
      addLog(`Player left`);
    });

    socket.on("gameEnded", (data: any) => {
      setMessage(data.message);
      setGameStarted(false);
    });

    socket.on("error", (error: any) => {
      setMessage(error.message);
    });

    socketRef.current = socket;
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const createRoom = async () => {
    try {
      if (!playerName.trim()) return;
      setCreatingRoom(true);
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const tx = await call("createGame", code);
      if (tx) {
        setShouldJoin(code);
        setRoomCreated(true);
      }
      connectSocket(code, playerName, true);
      setCreatingRoom(false);
    } catch (error: any) {
      toast.error(error.message || "OOPPSS");
      setCreatingRoom(false);
    }
  };

  const joinRoom = async (roomCode: string) => {
    try {
      if (!roomCode.trim() || !playerName.trim()) return;
      connectSocket(roomCode, playerName, false);
    } catch (error: any) {
      toast.error(error.message || "OOPPSS");
    }
  };

  const startOnlineGame = async () => {
    try {
      if (!isHost || connectedPlayers.length < 2) return;
      if (socketRef.current) {
        socketRef.current.emit("startGame", { roomCode });
        await call("startGame", roomCode);
      }
    } catch (error: any) {
      toast.error(error.message || "OOPPSS");
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startComputerGame = (piece: string) => {
    const compPiece = AVAILABLE_PIECES.filter((p) => p !== piece)[0];
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
      },
    ]);
    setGameStarted(true);
    setGameMode("computer");
    setCurrentPlayer(0);
    setCanRoll(true);
    setMessage("Your turn!");
  };

  const playDiceSound = () => {
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 200;
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => {
        osc.frequency.value = 300;
      }, 50);
      setTimeout(() => {
        osc.stop();
      }, 150);
    } catch {}
  };

  useEffect(() => {
    if (
      gameStarted &&
      gameMode === "computer" &&
      players[currentPlayer]?.isComputer &&
      canRoll &&
      !showBuyModal
    ) {
      setTimeout(rollDice, 1500);
    }
  }, [currentPlayer, canRoll, showBuyModal, gameStarted, gameMode]);

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

  const rollDice = async () => {
    try {
      if (!canRoll || isRolling) return;
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      // stopTurnTimer();
      playDiceSound();
      if (gameMode === "online") {
        if (currentPlayer !== myPlayerId) return;
        if (socketRef.current) {
          socketRef.current.emit("rollDice", {
            roomCode,
            playerId: myPlayerId,
          });
          await call("rollDice", roomCode, die1, die2);
        }
        return;
      }

      setIsRolling(true);
      setCanRoll(false);

      setDice([die1, die2]);

      setTimeout(() => {
        const total = die1 + die2;
        const newPlayers = [...players];
        const player = newPlayers[currentPlayer];
        let newPos = player.position + total;

        if (newPos >= 40) {
          player.money += 200;
          addLog(`${player.name} passed GO! +$200`);
          newPos = newPos % 40;
        }

        player.position = newPos;
        const prop = gameProperties[newPos];

        if (prop.name === "Go To Jail") {
          player.position = 10;
          addLog(`${player.name} to Jail!`);
          setPlayers(newPlayers);
          setIsRolling(false);
          setTimeout(() => {
            setCurrentPlayer((currentPlayer + 1) % players.length);
            setCanRoll(true);
          }, 2000);
          return;
        } else if (prop.name === "Income Tax") {
          player.money -= 200;
          addLog(`${player.name} paid $200 tax`);
        } else if (prop.name === "Luxury Tax") {
          player.money -= 100;
          addLog(`${player.name} paid $100 tax`);
        } else if (prop.price > 0) {
          if (prop.owner === null) {
            setCurrentProperty(prop);
            setShowBuyModal(true);
            if (player.isComputer) computerDecision(prop);
            setPlayers(newPlayers);
            setIsRolling(false);
            return;
          } else if (prop.owner !== currentPlayer) {
            const rent = prop.rent[prop.houses];
            player.money -= rent;
            newPlayers[prop.owner].money += rent;
            addLog(`Paid ${rent} rent`);
            if (prop.houses > 0) {
              const buildingType =
                prop.houses === 5
                  ? "hotel"
                  : `${prop.houses} house${prop.houses > 1 ? "s" : ""}`;
              addLog(`Property has ${buildingType}`);
            }
          }
        } else if (prop.name === "Chance" || prop.name === "Community Chest") {
          const amt = Math.random() > 0.5 ? 50 : -50;
          player.money += amt;
          addLog(`${amt > 0 ? "+" : ""}${amt}`);
        }

        setPlayers(newPlayers);
        setIsRolling(false);

        setTimeout(() => {
          setCurrentPlayer((currentPlayer + 1) % players.length);
          setCanRoll(true);
        }, 2000);
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "OOPPSS");
    }
  };

  const buyProperty = async (prop: Property) => {
    try {
      if (!prop) return;

      if (gameMode === "online") {
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
      }

      setShowBuyModal(false);
      setCurrentProperty(null);

      if (gameMode === "computer") {
        setTimeout(() => {
          setCurrentPlayer((currentPlayer + 1) % players.length);
          setCanRoll(true);
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "OOPPSS");
    }
  };

  const skipProperty = () => {
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
      setTimeout(() => {
        setCurrentPlayer((currentPlayer + 1) % players.length);
        setCanRoll(true);
      }, 1500);
    }
  };

  // Splash Screen
  if (showSplash) {
    return (
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
            className="text-7xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-transparent bg-clip-text animate-gradient"
            style={{
              fontFamily: "'Press Start 2P', 'Orbitron', cursive, monospace",
            }}
          >
            STARKCITY
          </h1>

          <p
            className="text-2xl uppercase font-bold text-purple-300 mb-8 animate-bounce"
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
    );
  }

  if (gameMode === "menu") {
    return (
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
          </div>
        </div>
      </div>
    );
  }

  if (gameMode === "online" && !gameStarted) {
    return (
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
          <p className="text-center text-cyan-200 mb-8 font-bold">{message}</p>

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
                  {creatingRoom ? "Creating..." : " CREATE ROOM"}
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
    );
  }

  if (gameMode === "computer" && !gameStarted) {
    return (
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
    );
  }

  const bottomRow = [
    gameProperties[10],
    gameProperties[9],
    gameProperties[8],
    gameProperties[7],
    gameProperties[6],
    gameProperties[5],
    gameProperties[4],
    gameProperties[3],
    gameProperties[2],
    gameProperties[1],
    gameProperties[0],
  ];

  const rightColumn = [
    gameProperties[39],
    gameProperties[38],
    gameProperties[37],
    gameProperties[36],
    gameProperties[35],
    gameProperties[34],
    gameProperties[33],
    gameProperties[32],
    gameProperties[31],
  ].reverse();

  const topRow = [
    gameProperties[30],
    gameProperties[29],
    gameProperties[28],
    gameProperties[27],
    gameProperties[26],
    gameProperties[25],
    gameProperties[24],
    gameProperties[23],
    gameProperties[22],
    gameProperties[21],
    gameProperties[20],
  ].reverse();

  const leftColumn = [
    gameProperties[19],
    gameProperties[18],
    gameProperties[17],
    gameProperties[16],
    gameProperties[15],
    gameProperties[14],
    gameProperties[13],
    gameProperties[12],
    gameProperties[11],
  ];

  const myProperties =
    gameMode === "online"
      ? gameProperties.filter(
          (p) => p.owner === myPlayerId && p.type === "property"
        )
      : gameProperties.filter(
          (p) => p.owner === currentPlayer && p.type === "property"
        );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-1 sm:p-2 rounded-lg shadow-2xl border-4 border-yellow-500">
              <div className="grid grid-cols-11 gap-0">
                {topRow.map((prop) => (
                  <div key={prop.position} className="col-span-1 aspect-square">
                    <PropertySpace prop={prop} players={players} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-11 gap-0">
                <div className="col-span-1 grid grid-rows-9 gap-0">
                  {leftColumn.map((prop) => (
                    <div key={prop.position} className="aspect-square">
                      <PropertySpace prop={prop} players={players} />
                    </div>
                  ))}
                </div>

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

                    <div className="flex gap-2 sm:gap-4 mb-2 sm:mb-4">
                      {dice.map((d, i) => (
                        <div
                          key={i}
                          className="bg-white p-2 sm:p-4 rounded-xl shadow-2xl border-4 border-yellow-400 transform hover:scale-110 transition-transform"
                        >
                          <DiceIcon value={d} />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={rollDice}
                      disabled={
                        !canRoll ||
                        isRolling ||
                        showBuyModal ||
                        (gameMode === "computer" &&
                          players[currentPlayer]?.isComputer) ||
                        (gameMode === "online" && currentPlayer !== myPlayerId)
                      }
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 text-gray-900 font-black py-2 px-4 sm:py-4 sm:px-8 rounded-full text-sm sm:text-2xl shadow-2xl transition-all transform hover:scale-110 disabled:scale-100 border-4 border-yellow-600 disabled:border-gray-800"
                      style={{ fontFamily: "'Bangers', cursive" }}
                    >
                      {isRolling ? "ROLLING..." : "ROLL DICE!"}
                    </button>
                    <div className="text-white text-xs sm:text-lg text-center bg-gray-900 px-2 py-1 sm:px-4 sm:py-2 rounded-lg mt-2 sm:mt-4 max-w-md font-bold border-2 border-yellow-400">
                      {message}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 grid grid-rows-9 gap-0">
                  {rightColumn.map((prop) => (
                    <div key={prop.position} className="aspect-square">
                      <PropertySpace prop={prop} players={players} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-11 gap-0">
                {bottomRow.map((prop) => (
                  <div key={prop.position} className="col-span-1 aspect-square">
                    <PropertySpace prop={prop} players={players} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-4 mt-4 lg:mt-0">
            {players.map((player, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 shadow-lg border-4 ${
                  idx === currentPlayer
                    ? "border-yellow-400 ring-4 ring-yellow-300"
                    : "border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl sm:text-4xl">{player.piece}</div>
                    <span
                      className="font-black text-base sm:text-xl text-white"
                      style={{ fontFamily: "'Bangers', cursive" }}
                    >
                      {player.name}
                    </span>
                  </div>
                  {idx === currentPlayer && (
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
                </div>
              </div>
            ))}

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

      {showBuyModal &&
        currentProperty &&
        (gameMode === "computer"
          ? !players[currentPlayer]?.isComputer
          : currentPlayer === myPlayerId) && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,.5)] flex items-center justify-center z-50 p-4 backdrop-blur-sm">
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
                  disabled={
                    players[currentPlayer]?.money < currentProperty.price
                  }
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

      {showManageProperties && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,.5)] flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
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
              {myProperties.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">
                    You don't own any properties yet!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {myProperties.map((prop) => {
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

                          {!hasMonopoly && (
                            <div className="text-xs text-orange-400 bg-orange-900 px-2 py-1 rounded font-bold border-2 border-orange-600">
                              ⚠️ Need complete color set!
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
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

      {showProperties && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
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
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
