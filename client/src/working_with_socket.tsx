import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, List, X, Users, Cpu, Copy, Check, Play, Home, Building2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Property {
    name: string;
    price: number;
    rent: number[];
    color: string;
    position: number;
    owner: number | null;
    houses: number;
    type: 'property' | 'railroad' | 'utility' | 'special';
    housePrice?: number;
}

interface Player {
    id: number;
    name: string;
    position: number;
    money: number;
    properties: number[];
    color: string;
    piece: string;
    isComputer: boolean;
}

const properties: Property[] = [
    { name: 'GO', price: 0, rent: [0], color: '', position: 0, owner: null, houses: 0, type: 'special' },
    { name: 'Mediterranean Avenue', price: 60, rent: [2, 10, 30, 90, 160, 250], color: 'bg-purple-900', position: 1, owner: null, houses: 0, type: 'property', housePrice: 50 },
    { name: 'Community Chest', price: 0, rent: [0], color: '', position: 2, owner: null, houses: 0, type: 'special' },
    { name: 'Baltic Avenue', price: 60, rent: [4, 20, 60, 180, 320, 450], color: 'bg-purple-900', position: 3, owner: null, houses: 0, type: 'property', housePrice: 50 },
    { name: 'Income Tax', price: 0, rent: [0], color: '', position: 4, owner: null, houses: 0, type: 'special' },
    { name: 'Reading Railroad', price: 200, rent: [25, 50, 100, 200], color: '', position: 5, owner: null, houses: 0, type: 'railroad' },
    { name: 'Oriental Avenue', price: 100, rent: [6, 30, 90, 270, 400, 550], color: 'bg-sky-400', position: 6, owner: null, houses: 0, type: 'property', housePrice: 50 },
    { name: 'Chance', price: 0, rent: [0], color: '', position: 7, owner: null, houses: 0, type: 'special' },
    { name: 'Vermont Avenue', price: 100, rent: [6, 30, 90, 270, 400, 550], color: 'bg-sky-400', position: 8, owner: null, houses: 0, type: 'property', housePrice: 50 },
    { name: 'Connecticut Avenue', price: 120, rent: [8, 40, 100, 300, 450, 600], color: 'bg-sky-400', position: 9, owner: null, houses: 0, type: 'property', housePrice: 50 },
    { name: 'Just Visiting', price: 0, rent: [0], color: '', position: 10, owner: null, houses: 0, type: 'special' },
    { name: 'St. Charles Place', price: 140, rent: [10, 50, 150, 450, 625, 750], color: 'bg-pink-600', position: 11, owner: null, houses: 0, type: 'property', housePrice: 100 },
    { name: 'Electric Company', price: 150, rent: [0], color: '', position: 12, owner: null, houses: 0, type: 'utility' },
    { name: 'States Avenue', price: 140, rent: [10, 50, 150, 450, 625, 750], color: 'bg-pink-600', position: 13, owner: null, houses: 0, type: 'property', housePrice: 100 },
    { name: 'Virginia Avenue', price: 160, rent: [12, 60, 180, 500, 700, 900], color: 'bg-pink-600', position: 14, owner: null, houses: 0, type: 'property', housePrice: 100 },
    { name: 'Pennsylvania Railroad', price: 200, rent: [25, 50, 100, 200], color: '', position: 15, owner: null, houses: 0, type: 'railroad' },
    { name: 'St. James Place', price: 180, rent: [14, 70, 200, 550, 750, 950], color: 'bg-orange-600', position: 16, owner: null, houses: 0, type: 'property', housePrice: 100 },
    { name: 'Community Chest', price: 0, rent: [0], color: '', position: 17, owner: null, houses: 0, type: 'special' },
    { name: 'Tennessee Avenue', price: 180, rent: [14, 70, 200, 550, 750, 950], color: 'bg-orange-600', position: 18, owner: null, houses: 0, type: 'property', housePrice: 100 },
    { name: 'New York Avenue', price: 200, rent: [16, 80, 220, 600, 800, 1000], color: 'bg-orange-600', position: 19, owner: null, houses: 0, type: 'property', housePrice: 100 },
    { name: 'Free Parking', price: 0, rent: [0], color: '', position: 20, owner: null, houses: 0, type: 'special' },
    { name: 'Kentucky Avenue', price: 220, rent: [18, 90, 250, 700, 875, 1050], color: 'bg-red-600', position: 21, owner: null, houses: 0, type: 'property', housePrice: 150 },
    { name: 'Chance', price: 0, rent: [0], color: '', position: 22, owner: null, houses: 0, type: 'special' },
    { name: 'Indiana Avenue', price: 220, rent: [18, 90, 250, 700, 875, 1050], color: 'bg-red-600', position: 23, owner: null, houses: 0, type: 'property', housePrice: 150 },
    { name: 'Illinois Avenue', price: 240, rent: [20, 100, 300, 750, 925, 1100], color: 'bg-red-600', position: 24, owner: null, houses: 0, type: 'property', housePrice: 150 },
    { name: 'B. & O. Railroad', price: 200, rent: [25, 50, 100, 200], color: '', position: 25, owner: null, houses: 0, type: 'railroad' },
    { name: 'Atlantic Avenue', price: 260, rent: [22, 110, 330, 800, 975, 1150], color: 'bg-yellow-500', position: 26, owner: null, houses: 0, type: 'property', housePrice: 150 },
    { name: 'Ventnor Avenue', price: 260, rent: [22, 110, 330, 800, 975, 1150], color: 'bg-yellow-500', position: 27, owner: null, houses: 0, type: 'property', housePrice: 150 },
    { name: 'Water Works', price: 150, rent: [0], color: '', position: 28, owner: null, houses: 0, type: 'utility' },
    { name: 'Marvin Gardens', price: 280, rent: [24, 120, 360, 850, 1025, 1200], color: 'bg-yellow-500', position: 29, owner: null, houses: 0, type: 'property', housePrice: 150 },
    { name: 'Go To Jail', price: 0, rent: [0], color: '', position: 30, owner: null, houses: 0, type: 'special' },
    { name: 'Pacific Avenue', price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: 'bg-green-600', position: 31, owner: null, houses: 0, type: 'property', housePrice: 200 },
    { name: 'North Carolina Avenue', price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: 'bg-green-600', position: 32, owner: null, houses: 0, type: 'property', housePrice: 200 },
    { name: 'Community Chest', price: 0, rent: [0], color: '', position: 33, owner: null, houses: 0, type: 'special' },
    { name: 'Pennsylvania Avenue', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], color: 'bg-green-600', position: 34, owner: null, houses: 0, type: 'property', housePrice: 200 },
    { name: 'Short Line', price: 200, rent: [25, 50, 100, 200], color: '', position: 35, owner: null, houses: 0, type: 'railroad' },
    { name: 'Chance', price: 0, rent: [0], color: '', position: 36, owner: null, houses: 0, type: 'special' },
    { name: 'Park Place', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], color: 'bg-blue-900', position: 37, owner: null, houses: 0, type: 'property', housePrice: 200 },
    { name: 'Luxury Tax', price: 0, rent: [0], color: '', position: 38, owner: null, houses: 0, type: 'special' },
    { name: 'Boardwalk', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], color: 'bg-blue-900', position: 39, owner: null, houses: 0, type: 'property', housePrice: 200 },
];

const availablePieces = ['🚗', '🎩', '🚢', '🐕', '🐈', '👞', '🎸', '⚓'];
const playerColors = ['bg-blue-600', 'bg-red-600', 'bg-green-600', 'bg-yellow-600'];

const SOCKET_SERVER_URL = 'http://localhost:9000';

const DiceIcon = ({ value }: { value: number }) => {
    const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const Icon = icons[value - 1];
    return <Icon className="w-8 h-8" />;
};

const PropertySpace = ({ prop, players }: { prop: Property; players: Player[] }) => {
    const playersHere = players.filter(p => p.position === prop.position);

    if (prop.type === 'property') {
        return (
            <div className="h-full w-full bg-white border border-gray-800 flex flex-col text-[10px] relative">
                <div className={`${prop.color} h-6 w-full flex items-center justify-center text-white font-bold text-[8px]`}>
                    {prop.owner !== null && players[prop.owner] && <div className={`w-2 h-2 rounded-full ${players[prop.owner].color} absolute top-1`}></div>}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-1 text-center leading-tight">
                    <div className="font-semibold">{prop.name.split(' ')[0]}</div>
                    <div className="font-semibold">{prop.name.split(' ').slice(1).join(' ')}</div>
                    <div className="text-[9px] font-bold mt-1">${prop.price}</div>
                    {prop.houses > 0 && (
                        <div className="flex gap-0.5 mt-1">
                            {prop.houses === 5 ? (
                                <div className="text-red-600 text-xs">🏨</div>
                            ) : (
                                Array.from({ length: prop.houses }).map((_, i) => (
                                    <div key={i} className="text-green-600 text-[8px]">🏠</div>
                                ))
                            )}
                        </div>
                    )}
                </div>
                {playersHere.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-2xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.type === 'railroad') {
        return (
            <div className="h-full w-full bg-white border border-gray-800 flex flex-col items-center justify-center text-[10px] p-1 relative">
                <div className="font-bold text-center leading-tight text-[9px]">{prop.name}</div>
                <div className="text-2xl">🚂</div>
                <div className="font-bold text-[9px]">${prop.price}</div>
                {prop.owner !== null && players[prop.owner] && <div className={`w-2 h-2 rounded-full ${players[prop.owner].color} absolute top-1`}></div>}
                {playersHere.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-2xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.type === 'utility') {
        return (
            <div className="h-full w-full bg-white border border-gray-800 flex flex-col items-center justify-center text-[10px] p-1 relative">
                <div className="font-bold text-center leading-tight text-[9px]">{prop.name}</div>
                <div className="text-2xl">{prop.name.includes('Electric') ? '💡' : '💧'}</div>
                <div className="font-bold text-[9px]">${prop.price}</div>
                {prop.owner !== null && players[prop.owner] && <div className={`w-2 h-2 rounded-full ${players[prop.owner].color} absolute top-1`}></div>}
                {playersHere.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-2xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.name === 'GO') {
        return (
            <div className="h-full w-full bg-red-600 border border-gray-800 flex flex-col items-center justify-center text-white font-bold relative">
                <div className="text-2xl rotate-180">→</div>
                <div className="text-xs">GO</div>
                <div className="text-[8px]">COLLECT $200</div>
                {playersHere.length > 0 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-3xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.name === 'Just Visiting') {
        return (
            <div className="h-full w-full bg-orange-400 border border-gray-800 relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold">
                    <div className="text-xs">JUST</div>
                    <div className="text-xs">VISITING</div>
                </div>
                <div className="absolute top-1 right-1 text-3xl">🚔</div>
                {playersHere.length > 0 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-3xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.name === 'Free Parking') {
        return (
            <div className="h-full w-full bg-red-600 border border-gray-800 flex flex-col items-center justify-center text-white font-bold relative">
                <div className="text-2xl">🅿️</div>
                <div className="text-[10px]">FREE</div>
                <div className="text-[10px]">PARKING</div>
                {playersHere.length > 0 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-3xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.name === 'Go To Jail') {
        return (
            <div className="h-full w-full bg-orange-600 border border-gray-800 flex flex-col items-center justify-center text-white font-bold relative">
                <div className="text-2xl">👮</div>
                <div className="text-[9px]">GO TO</div>
                <div className="text-[9px]">JAIL</div>
                {playersHere.length > 0 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-3xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.name === 'Community Chest') {
        return (
            <div className="h-full w-full bg-white border border-gray-800 flex flex-col items-center justify-center relative">
                <div className="text-2xl">📦</div>
                <div className="text-[8px] font-bold text-center leading-tight">COMMUNITY<br />CHEST</div>
                {playersHere.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-2xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.name === 'Chance') {
        return (
            <div className="h-full w-full bg-white border border-gray-800 flex flex-col items-center justify-center relative">
                <div className="text-2xl">❓</div>
                <div className="text-[9px] font-bold">CHANCE</div>
                {playersHere.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-2xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.name === 'Income Tax') {
        return (
            <div className="h-full w-full bg-white border border-gray-800 flex flex-col items-center justify-center relative">
                <div className="text-2xl">💰</div>
                <div className="text-[8px] font-bold text-center leading-tight">INCOME<br />TAX<br />$200</div>
                {playersHere.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-2xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (prop.name === 'Luxury Tax') {
        return (
            <div className="h-full w-full bg-white border border-gray-800 flex flex-col items-center justify-center relative">
                <div className="text-2xl">💎</div>
                <div className="text-[8px] font-bold text-center leading-tight">LUXURY<br />TAX<br />$100</div>
                {playersHere.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {playersHere.map(p => (
                            <div key={p.id} className="text-2xl drop-shadow-lg">{p.piece}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return <div className="h-full w-full bg-white border border-gray-800"></div>;
};

export default function MonopolyGame() {
    const [gameMode, setGameMode] = useState<'menu' | 'computer' | 'online'>('menu');
    const [gameStarted, setGameStarted] = useState(false);

    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [connectedPlayers, setConnectedPlayers] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const [myPlayerId, setMyPlayerId] = useState<number>(0);
    const [showJoinInput, setShowJoinInput] = useState(false);

    const [selectedPiece, setSelectedPiece] = useState('');
    const [gameProperties, setGameProperties] = useState<Property[]>(properties);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [dice, setDice] = useState<[number, number]>([1, 1]);
    const [message, setMessage] = useState('Choose your game mode!');
    const [gameLog, setGameLog] = useState<string[]>([]);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
    const [showProperties, setShowProperties] = useState(false);
    const [isRolling, setIsRolling] = useState(false);
    const [canRoll, setCanRoll] = useState(false);
    const [showManageProperties, setShowManageProperties] = useState(false);

    const addLog = (msg: string) => {
        setGameLog(prev => [...prev.slice(-4), msg]);
    };

    // Check if player owns all properties of a color group
    const ownsMonopoly = (playerId: number, color: string): boolean => {
        const colorProperties = gameProperties.filter(p => p.color === color && p.type === 'property');
        return colorProperties.every(p => p.owner === playerId);
    };

    // Buy house or hotel
    const buyHouse = (propertyIndex: number) => {
        const prop = gameProperties[propertyIndex];
        if (!prop || prop.type !== 'property' || !prop.housePrice) return;

        if (gameMode === 'online') {
            if (socketRef.current) {
                socketRef.current.emit('buyHouse', {
                    roomCode,
                    propertyPosition: propertyIndex,
                    playerId: myPlayerId
                });
            }
            return;
        }

        const player = players[currentPlayer];
        if (prop.owner !== currentPlayer) return;
        if (!ownsMonopoly(currentPlayer, prop.color)) {
            setMessage('Need monopoly to build!');
            addLog('Need all properties of this color');
            return;
        }
        if (prop.houses >= 5) {
            setMessage('Already has hotel!');
            return;
        }
        if (player.money < prop.housePrice) {
            setMessage('Not enough money!');
            return;
        }

        const newPlayers = [...players];
        newPlayers[currentPlayer].money -= prop.housePrice;
        setPlayers(newPlayers);

        const newProps = [...gameProperties];
        newProps[propertyIndex].houses += 1;
        setGameProperties(newProps);

        const buildingName = newProps[propertyIndex].houses === 5 ? 'hotel' : 'house';
        addLog(`Built ${buildingName} on ${prop.name}`);
        setMessage(`Built ${buildingName}!`);
    };

    // Sell house or hotel
    const sellHouse = (propertyIndex: number) => {
        const prop = gameProperties[propertyIndex];
        if (!prop || prop.type !== 'property' || !prop.housePrice) return;

        if (gameMode === 'online') {
            if (socketRef.current) {
                socketRef.current.emit('sellHouse', {
                    roomCode,
                    propertyPosition: propertyIndex,
                    playerId: myPlayerId
                });
            }
            return;
        }

        const player = players[currentPlayer];
        if (prop.owner !== currentPlayer) return;
        if (prop.houses === 0) return;

        const newPlayers = [...players];
        newPlayers[currentPlayer].money += Math.floor(prop.housePrice / 2);
        setPlayers(newPlayers);

        const newProps = [...gameProperties];
        const wasHotel = newProps[propertyIndex].houses === 5;
        newProps[propertyIndex].houses -= 1;
        setGameProperties(newProps);

        const buildingName = wasHotel ? 'hotel' : 'house';
        addLog(`Sold ${buildingName} on ${prop.name}`);
        setMessage(`Sold ${buildingName}!`);
    };

    const connectSocket = (room: string, name: string, host: boolean) => {
        const socket = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            reconnection: true
        });

        socket.on('connect', () => {
            console.log('✅ Connected');
            socket.emit('joinRoom', { room, name, isHost: host });
        });

        socket.on('roomJoined', (data: any) => {
            setConnectedPlayers(data.players);
            setMyPlayerId(data.playerId);
            setRoomCode(data.roomCode);
            setIsHost(data.isHost);
            addLog(`You joined`);
            setMessage(`Room: ${data.roomCode}`);
        });

        socket.on('playerJoined', (data: any) => {
            setConnectedPlayers(data.players);
            addLog(`${data.playerName} joined`);
        });

        socket.on('gameStarted', (data: any) => {
            setPlayers(data.players);
            setGameStarted(true);
            setCurrentPlayer(data.currentPlayer);
            setCanRoll(data.currentPlayer === myPlayerId);
            setMessage(`${data.players[data.currentPlayer].name}'s turn`);
        });

        socket.on('fullGameState', (state: any) => {
            const myPlayer = state.players.find((fd: any) => fd.socketId.toLowerCase() === socket.id?.toLowerCase());
            if (!myPlayer) {
                return;
            };
            const myPlayerId = myPlayer.id;
            setGameProperties(state.properties);
            setPlayers(state.players);
            setCurrentPlayer(state.currentPlayer);
            setDice(state.dice);
            setGameLog(state.gameLog);
            setGameStarted(state.gameStarted);
            setCanRoll(state.currentPlayer === myPlayerId && state.gameStarted && !state.turnInProgress);
        });

        socket.on('diceRolled', (data: any) => {
            setDice(data.dice);
            setIsRolling(true);
            setCanRoll(false);
            playDiceSound()
            addLog(`${data.playerName} rolled ${data.dice[0]}+${data.dice[1]}`);
            setTimeout(() => setIsRolling(false), 1000);
        });

        socket.on('playerMoved', (data: any) => {
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

        socket.on('propertyLanded', (data: any) => {
            const myPlayer = data.players.find((fd: any) => fd.socketId.toLowerCase() === socket.id?.toLowerCase());
            if (!myPlayer) {
                return;
            };
            const myPlayerId = myPlayer.id;
            if (data.playerId === myPlayerId) {
                const prop = gameProperties[data.propertyPosition];
                setCurrentProperty(prop);
                setShowBuyModal(true);
                setMessage(`Buy ${data.propertyName}?`);
                setCanRoll(false);
            }
        });

        socket.on('propertyPurchased', (data: any) => {
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

        socket.on('propertySkipped', () => {
            setShowBuyModal(false);
            setCurrentProperty(null);
        });

        socket.on('turnChanged', (data: any) => {
            setCurrentPlayer(data.currentPlayer);
            setCanRoll(data.currentPlayer === myPlayerId);
            setMessage(`${data.playerName}'s turn`);
        });

        socket.on('houseBought', (data: any) => {
            const newProperties = [...gameProperties];
            newProperties[data.propertyPosition].houses = data.houses;
            setGameProperties(newProperties);

            const newPlayers = [...players];
            if (newPlayers[data.playerId]) {
                newPlayers[data.playerId].money = data.newMoney;
                setPlayers(newPlayers);
            }

            addLog(`${data.playerName} built ${data.buildingName} on ${data.propertyName}`);
            setMessage(`${data.playerName} built ${data.buildingName}!`);
        });

        socket.on('houseSold', (data: any) => {
            const newProperties = [...gameProperties];
            newProperties[data.propertyPosition].houses = data.houses;
            setGameProperties(newProperties);

            const newPlayers = [...players];
            if (newPlayers[data.playerId]) {
                newPlayers[data.playerId].money = data.newMoney;
                setPlayers(newPlayers);
            }

            addLog(`${data.playerName} sold ${data.buildingName} on ${data.propertyName}`);
            setMessage(`${data.playerName} sold ${data.buildingName}!`);
        });

        socket.on('playerLeft', (data: any) => {
            setConnectedPlayers(data.players);
            addLog(`Player left`);
        });

        socket.on('gameEnded', (data: any) => {
            setMessage(data.message);
            setGameStarted(false);
        });

        socket.on('error', (error: any) => {
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

    const createRoom = () => {
        if (!playerName.trim()) return;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        connectSocket(code, playerName, true);
    };

    const joinRoom = (roomCode: string) => {
        if (!roomCode.trim() || !playerName.trim()) return;
        connectSocket(roomCode, playerName, false);
    };

    const startOnlineGame = () => {
        if (!isHost || connectedPlayers.length < 2) return;
        if (socketRef.current) {
            socketRef.current.emit('startGame', { roomCode });
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const startComputerGame = (piece: string) => {
        const compPiece = availablePieces.filter(p => p !== piece)[0];
        setPlayers([
            { id: 0, name: 'You', position: 0, money: 1500, properties: [], color: 'bg-blue-600', piece, isComputer: false },
            { id: 1, name: 'AI', position: 0, money: 1500, properties: [], color: 'bg-red-600', piece: compPiece, isComputer: true },
        ]);
        setGameStarted(true);
        setGameMode('computer');
        setCurrentPlayer(0);
        setCanRoll(true);
        setMessage('Your turn!');
    };

    const playDiceSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 200;
            gain.gain.value = 0.1;
            osc.start();
            setTimeout(() => { osc.frequency.value = 300; }, 50);
            setTimeout(() => { osc.stop(); }, 150);
        } catch { }
    };

    useEffect(() => {
        if (gameStarted && gameMode === 'computer' && players[currentPlayer]?.isComputer && canRoll && !showBuyModal) {
            setTimeout(rollDice, 1500);
        }
    }, [currentPlayer, canRoll, showBuyModal, gameStarted, gameMode]);

    const computerDecision = (prop: Property) => {
        setTimeout(() => {
            const afford = (players[1].money - prop.price) / players[1].money;
            const buy = players[1].money >= prop.price && (
                prop.price < 150 ? Math.random() > 0.2 :
                    afford > 0.5 ? Math.random() > 0.3 :
                        afford > 0.3 ? Math.random() > 0.5 :
                            Math.random() > 0.7
            );
            setTimeout(() => buy ? buyProperty(prop) : skipProperty(), 800);
        }, 500);
    };

    const rollDice = () => {
        if (!canRoll || isRolling) return;
        playDiceSound()
        if (gameMode === 'online') {
            if (currentPlayer !== myPlayerId) return;
            if (socketRef.current) {
                socketRef.current.emit('rollDice', { roomCode, playerId: myPlayerId });
            }
            return;
        }

        setIsRolling(true);
        setCanRoll(false);

        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
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

            if (prop.name === 'Go To Jail') {
                player.position = 10;
                addLog(`${player.name} to Jail!`);
                setPlayers(newPlayers);
                setIsRolling(false);
                setTimeout(() => {
                    setCurrentPlayer((currentPlayer + 1) % players.length);
                    setCanRoll(true);
                }, 2000);
                return;
            } else if (prop.name === 'Income Tax') {
                player.money -= 200;
                addLog(`${player.name} paid $200 tax`);
            } else if (prop.name === 'Luxury Tax') {
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
                        const buildingType = prop.houses === 5 ? 'hotel' : `${prop.houses} house${prop.houses > 1 ? 's' : ''}`;
                        addLog(`Property has ${buildingType}`);
                    }
                }
            } else if (prop.name === 'Chance' || prop.name === 'Community Chest') {
                const amt = Math.random() > 0.5 ? 50 : -50;
                player.money += amt;
                addLog(`${amt > 0 ? '+' : ''}${amt}`);
            }

            setPlayers(newPlayers);
            setIsRolling(false);

            setTimeout(() => {
                setCurrentPlayer((currentPlayer + 1) % players.length);
                setCanRoll(true);
            }, 2000);
        }, 1000);
    };

    const buyProperty = (prop: Property) => {
        if (!prop) return;

        if (gameMode === 'online') {
            if (socketRef.current) {
                socketRef.current.emit('buyProperty', {
                    roomCode,
                    propertyPosition: prop.position,
                    playerId: myPlayerId
                });
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

        if (gameMode === 'computer') {
            setTimeout(() => {
                setCurrentPlayer((currentPlayer + 1) % players.length);
                setCanRoll(true);
            }, 1500);
        }
    };

    const skipProperty = () => {
        if (gameMode === 'online') {
            if (socketRef.current) {
                socketRef.current.emit('skipProperty', {
                    roomCode,
                    playerId: myPlayerId
                });
            }
            return;
        }

        setShowBuyModal(false);
        setCurrentProperty(null);

        if (gameMode === 'computer') {
            setTimeout(() => {
                setCurrentPlayer((currentPlayer + 1) % players.length);
                setCanRoll(true);
            }, 1500);
        }
    };

    if (gameMode === 'menu') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-8 max-w-2xl w-full shadow-2xl">
                    <h1 className="text-4xl font-bold text-center mb-2 text-teal-800">MONOPOLY</h1>
                    <p className="text-center text-gray-600 mb-8">Choose your mode</p>

                    <div className="space-y-4">
                        <button
                            onClick={() => setGameMode('computer')}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white p-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-4"
                        >
                            <Cpu className="w-8 h-8" />
                            <div className="text-left">
                                <div className="text-2xl font-bold">vs Computer</div>
                                <div className="text-sm opacity-90">Play against AI</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setGameMode('online')}
                            className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white p-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-4"
                        >
                            <Users className="w-8 h-8" />
                            <div className="text-left">
                                <div className="text-2xl font-bold">Online</div>
                                <div className="text-sm opacity-90">Play with friends</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameMode === 'online' && !gameStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-8 max-w-2xl w-full shadow-2xl">
                    <button
                        onClick={() => {
                            setGameMode('menu');
                            if (socketRef.current) socketRef.current.disconnect();
                        }}
                        className="mb-4 text-teal-600 hover:text-teal-800 font-semibold"
                    >
                        ← Back
                    </button>

                    <h1 className="text-4xl font-bold text-center mb-2 text-teal-800">Online</h1>
                    <p className="text-center text-gray-600 mb-8">{message}</p>

                    {!roomCode ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Your Name</label>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Enter name"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={createRoom}
                                    disabled={!playerName}
                                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg"
                                >
                                    Create Room
                                </button>

                                <button
                                    onClick={() => setShowJoinInput(!showJoinInput)}
                                    disabled={!playerName}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg"
                                >
                                    Join Room
                                </button>
                            </div>

                            {showJoinInput && playerName && (
                                <div>
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => {
                                            setRoomCode(e.target.value.toUpperCase());
                                            joinRoom(e.target.value.trim().toUpperCase())
                                        }}
                                        placeholder="Room code"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg uppercase mb-4"
                                        maxLength={6}
                                    />
                                    <button
                                        disabled={roomCode.length < 6}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg"
                                    >
                                        Join
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-teal-50 border-2 border-teal-300 rounded-lg p-6 text-center">
                                <p className="text-sm text-gray-600 mb-2">Room Code</p>
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-4xl font-bold text-teal-800">{roomCode}</p>
                                    <button onClick={copyRoomCode} className="p-2 hover:bg-teal-100 rounded-lg">
                                        {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-teal-600" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold mb-3">Players ({connectedPlayers.length}/4)</h3>
                                <div className="space-y-2">
                                    {connectedPlayers.map((p: any, i: number) => (
                                        <div key={i} className="bg-gray-100 p-3 rounded-lg flex items-center gap-3">
                                            <div className={`w-10 h-10 ${p.color} rounded-full flex items-center justify-center text-2xl`}>
                                                {p.piece}
                                            </div>
                                            <span className="font-semibold">{p.name}</span>
                                            {i === 0 && <span className="ml-auto text-xs bg-yellow-400 px-2 py-1 rounded">Host</span>}
                                            {p.id === myPlayerId && <span className="ml-auto text-xs bg-blue-400 text-white px-2 py-1 rounded">You</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isHost && connectedPlayers.length >= 2 && (
                                <button
                                    onClick={startOnlineGame}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3"
                                >
                                    <Play className="w-6 h-6" />
                                    Start Game
                                </button>
                            )}

                            {!isHost && (
                                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                                    <p className="text-yellow-800 font-semibold">Waiting for host...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (gameMode === 'computer' && !gameStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-8 max-w-2xl w-full shadow-2xl">
                    <button onClick={() => setGameMode('menu')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">
                        ← Back
                    </button>

                    <h1 className="text-4xl font-bold text-center mb-8 text-teal-800">Choose Your Piece</h1>
                    <div className="grid grid-cols-4 gap-4">
                        {availablePieces.map((piece) => (
                            <button
                                key={piece}
                                onClick={() => startComputerGame(piece)}
                                className="bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white p-8 rounded-lg text-6xl transition-all transform hover:scale-110 shadow-lg"
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
        gameProperties[10], gameProperties[9], gameProperties[8], gameProperties[7],
        gameProperties[6], gameProperties[5], gameProperties[4], gameProperties[3],
        gameProperties[2], gameProperties[1], gameProperties[0],
    ];

    const rightColumn = [
        gameProperties[39], gameProperties[38], gameProperties[37], gameProperties[36],
        gameProperties[35], gameProperties[34], gameProperties[33], gameProperties[32],
        gameProperties[31],
    ].reverse();

    const topRow = [
        gameProperties[30], gameProperties[29], gameProperties[28], gameProperties[27],
        gameProperties[26], gameProperties[25], gameProperties[24], gameProperties[23],
        gameProperties[22], gameProperties[21], gameProperties[20],
    ].reverse();

    const leftColumn = [
        gameProperties[19], gameProperties[18], gameProperties[17], gameProperties[16],
        gameProperties[15], gameProperties[14], gameProperties[13], gameProperties[12],
        gameProperties[11],
    ];


    const myProperties = gameMode === 'online'
        ? gameProperties.filter(p => p.owner === myPlayerId && p.type === 'property')
        : gameProperties.filter(p => p.owner === currentPlayer && p.type === 'property');

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-700 to-teal-900 p-2 sm:p-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h1 className="text-2xl sm:text-4xl font-bold text-white">MONOPOLY</h1>
                    <div className="flex gap-2">
                        {gameMode === 'online' && roomCode && (
                            <div className="bg-white text-teal-800 px-3 py-1 rounded-lg font-bold text-xs sm:text-sm">
                                {roomCode}
                            </div>
                        )}
                        <button
                            onClick={() => setShowManageProperties(!showManageProperties)}
                            className="bg-green-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-green-700"
                        >
                            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Build</span>
                        </button>
                        <button
                            onClick={() => setShowProperties(!showProperties)}
                            className="bg-white text-teal-800 px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-teal-50"
                        >
                            <List className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Properties</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
                    <div className="lg:col-span-2">
                        <div className="bg-teal-800 p-1 sm:p-2 rounded-lg shadow-2xl">
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

                                <div className="col-span-9 bg-teal-700 flex flex-col items-center justify-center p-2 sm:p-8">
                                    <div className="text-3xl sm:text-6xl font-bold text-white mb-1 sm:mb-2">M</div>
                                    <div className="text-lg sm:text-3xl font-bold text-white mb-2 sm:mb-6">MONOPOLY</div>
                                    <div className="flex gap-2 sm:gap-4 mb-2 sm:mb-4">
                                        {dice.map((d, i) => (
                                            <div key={i} className="bg-white p-1.5 sm:p-3 rounded-lg shadow-lg">
                                                <DiceIcon value={d} />
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={rollDice}
                                        disabled={!canRoll || isRolling || showBuyModal || (gameMode === 'computer' && players[currentPlayer]?.isComputer) || (gameMode === 'online' && currentPlayer !== myPlayerId)}
                                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-2 px-4 sm:py-4 sm:px-8 rounded-full text-sm sm:text-xl shadow-lg transition-all transform hover:scale-105 disabled:scale-100"
                                    >
                                        {isRolling ? 'Rolling...' : 'ROLL DICE'}
                                    </button>
                                    <div className="text-white text-xs sm:text-lg text-center bg-teal-900 px-2 py-1 sm:px-4 sm:py-2 rounded-lg mt-2 sm:mt-4 max-w-md">{message}</div>
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
                            <div key={idx} className={`bg-white rounded-lg p-3 sm:p-4 shadow-lg ${idx === currentPlayer ? 'ring-2 sm:ring-4 ring-yellow-400' : ''}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="text-2xl sm:text-3xl">{player.piece}</div>
                                        <span className="font-bold text-base sm:text-lg">{player.name}</span>
                                    </div>
                                    {idx === currentPlayer && (
                                        <span className="text-xs sm:text-sm bg-yellow-400 px-2 py-1 rounded font-bold">Turn</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-green-600 font-bold text-lg sm:text-xl">
                                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                                    {player.money}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">Props: {player.properties.length}</div>
                            </div>
                        ))}

                        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg">
                            <h3 className="font-bold mb-2 text-sm sm:text-base">Log</h3>
                            <div className="space-y-1 text-xs sm:text-sm max-h-32 sm:max-h-40 overflow-y-auto">
                                {gameLog.map((log, idx) => (
                                    <div key={idx} className="text-gray-700">{log}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showBuyModal && currentProperty && (gameMode === 'computer' ? !players[currentPlayer]?.isComputer : currentPlayer === myPlayerId) && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,.5)] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl sm:text-2xl font-bold mb-4">{currentProperty.name}</h2>
                        <p className="text-base sm:text-lg mb-2">Price: ${currentProperty.price}</p>
                        <p className="text-sm sm:text-base text-gray-600 mb-4">Rent: ${currentProperty.rent[0]}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mb-6">Money: ${players[currentPlayer]?.money || 0}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => buyProperty(currentProperty)}
                                disabled={players[currentPlayer]?.money < currentProperty.price}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 sm:py-3 rounded-lg"
                            >
                                Buy
                            </button>
                            <button
                                onClick={skipProperty}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 sm:py-3 rounded-lg"
                            >
                                Skip
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showManageProperties && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,.5)] flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl sm:text-3xl font-bold">Manage Properties</h2>
                            <button onClick={() => setShowManageProperties(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {myProperties.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">You don't own any properties yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    {myProperties.map((prop) => {
                                        const currentOwnerId = gameMode === 'online' ? myPlayerId : currentPlayer;
                                        const hasMonopoly = ownsMonopoly(currentOwnerId, prop.color);
                                        const currentPlayerData = gameMode === 'online'
                                            ? players.find(p => p.id === myPlayerId)
                                            : players[currentPlayer];
                                        const canBuyHouse = hasMonopoly && prop.houses < 5 && currentPlayerData && currentPlayerData.money >= (prop.housePrice || 0);
                                        const canSellHouse = prop.houses > 0;

                                        return (
                                            <div key={prop.position} className="border-2 rounded-lg p-3 sm:p-4 bg-gradient-to-br from-white to-gray-50">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className={`${prop.color} text-white px-2 py-1 rounded text-xs font-bold mb-2 inline-block`}>
                                                            {prop.name}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            Base Rent: ${prop.rent[0]}
                                                        </div>
                                                        {prop.houses > 0 && (
                                                            <div className="text-sm font-bold text-green-700 mt-1">
                                                                Current Rent: ${prop.rent[prop.houses]}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-semibold">Buildings:</span>
                                                        {prop.houses === 0 && <span className="text-sm text-gray-500">None</span>}
                                                        {prop.houses > 0 && prop.houses < 5 && (
                                                            <div className="flex gap-1">
                                                                {Array.from({ length: prop.houses }).map((_, i) => (
                                                                    <span key={i} className="text-lg">🏠</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {prop.houses === 5 && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-2xl">🏨</span>
                                                                <span className="text-sm font-bold text-red-600">HOTEL</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!hasMonopoly && (
                                                        <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                            ⚠️ Need all {prop.color.replace('bg-', '').replace('-', ' ')} properties to build
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => buyHouse(prop.position)}
                                                        disabled={!canBuyHouse}
                                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all"
                                                    >
                                                        <Home className="w-4 h-4" />
                                                        {prop.houses === 4 ? 'Hotel' : 'House'} ${prop.housePrice}
                                                    </button>
                                                    <button
                                                        onClick={() => sellHouse(prop.position)}
                                                        disabled={!canSellHouse}
                                                        className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-2 rounded-lg text-sm transition-all"
                                                    >
                                                        Sell ${Math.floor((prop.housePrice || 0) / 2)}
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
                <div className="fixed inset-0 bg-[rgba(0,0,0,.5)] flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl sm:text-3xl font-bold">Properties</h2>
                            <button onClick={() => setShowProperties(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                {gameProperties.filter(p => p.price > 0).map((prop) => (
                                    <div key={prop.position} className={`border-2 rounded-lg p-3 sm:p-4 ${prop.owner !== null ? 'bg-green-50 border-green-300' : 'border-gray-300'}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className={`${prop.color || 'bg-gray-600'} text-white px-2 py-1 rounded text-xs font-bold mb-1 inline-block`}>
                                                    {prop.type.toUpperCase()}
                                                </div>
                                                <h3 className="font-bold text-base sm:text-lg">{prop.name}</h3>
                                            </div>
                                            {prop.owner !== null && players[prop.owner] && (
                                                <div className="flex flex-col items-center gap-1 ml-2">
                                                    <span className="text-2xl">{players[prop.owner].piece}</span>
                                                    <span className="text-xs font-semibold text-green-700">{players[prop.owner].name}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-semibold text-green-600">${prop.price}</p>
                                            <p className="text-gray-600">Base Rent: ${prop.rent[0]}</p>
                                            {prop.houses > 0 && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs font-semibold">Buildings:</span>
                                                    {prop.houses === 5 ? (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-lg">🏨</span>
                                                            <span className="text-xs font-bold text-red-600">HOTEL</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-0.5">
                                                            {Array.from({ length: prop.houses }).map((_, i) => (
                                                                <span key={i} className="text-sm">🏠</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {prop.houses > 0 && (
                                                <p className="text-sm font-bold text-green-700 mt-1">Current Rent: ${prop.rent[prop.houses]}</p>
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