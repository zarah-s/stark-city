import React, { useState, useEffect } from 'react';
import { DollarSign, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, List, X } from 'lucide-react';

interface Property {
  name: string;
  price: number;
  rent: number[];
  color: string;
  position: number;
  owner: number | null;
  houses: number;
  type: 'property' | 'railroad' | 'utility' | 'special';
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
  { name: 'Mediterranean Avenue', price: 60, rent: [2, 10, 30, 90, 160, 250], color: 'bg-purple-900', position: 1, owner: null, houses: 0, type: 'property' },
  { name: 'Community Chest', price: 0, rent: [0], color: '', position: 2, owner: null, houses: 0, type: 'special' },
  { name: 'Baltic Avenue', price: 60, rent: [4, 20, 60, 180, 320, 450], color: 'bg-purple-900', position: 3, owner: null, houses: 0, type: 'property' },
  { name: 'Income Tax', price: 0, rent: [0], color: '', position: 4, owner: null, houses: 0, type: 'special' },
  { name: 'Reading Railroad', price: 200, rent: [25, 50, 100, 200], color: '', position: 5, owner: null, houses: 0, type: 'railroad' },
  { name: 'Oriental Avenue', price: 100, rent: [6, 30, 90, 270, 400, 550], color: 'bg-sky-400', position: 6, owner: null, houses: 0, type: 'property' },
  { name: 'Chance', price: 0, rent: [0], color: '', position: 7, owner: null, houses: 0, type: 'special' },
  { name: 'Vermont Avenue', price: 100, rent: [6, 30, 90, 270, 400, 550], color: 'bg-sky-400', position: 8, owner: null, houses: 0, type: 'property' },
  { name: 'Connecticut Avenue', price: 120, rent: [8, 40, 100, 300, 450, 600], color: 'bg-sky-400', position: 9, owner: null, houses: 0, type: 'property' },
  { name: 'Just Visiting', price: 0, rent: [0], color: '', position: 10, owner: null, houses: 0, type: 'special' },
  { name: 'St. Charles Place', price: 140, rent: [10, 50, 150, 450, 625, 750], color: 'bg-pink-600', position: 11, owner: null, houses: 0, type: 'property' },
  { name: 'Electric Company', price: 150, rent: [0], color: '', position: 12, owner: null, houses: 0, type: 'utility' },
  { name: 'States Avenue', price: 140, rent: [10, 50, 150, 450, 625, 750], color: 'bg-pink-600', position: 13, owner: null, houses: 0, type: 'property' },
  { name: 'Virginia Avenue', price: 160, rent: [12, 60, 180, 500, 700, 900], color: 'bg-pink-600', position: 14, owner: null, houses: 0, type: 'property' },
  { name: 'Pennsylvania Railroad', price: 200, rent: [25, 50, 100, 200], color: '', position: 15, owner: null, houses: 0, type: 'railroad' },
  { name: 'St. James Place', price: 180, rent: [14, 70, 200, 550, 750, 950], color: 'bg-orange-600', position: 16, owner: null, houses: 0, type: 'property' },
  { name: 'Community Chest', price: 0, rent: [0], color: '', position: 17, owner: null, houses: 0, type: 'special' },
  { name: 'Tennessee Avenue', price: 180, rent: [14, 70, 200, 550, 750, 950], color: 'bg-orange-600', position: 18, owner: null, houses: 0, type: 'property' },
  { name: 'New York Avenue', price: 200, rent: [16, 80, 220, 600, 800, 1000], color: 'bg-orange-600', position: 19, owner: null, houses: 0, type: 'property' },
  { name: 'Free Parking', price: 0, rent: [0], color: '', position: 20, owner: null, houses: 0, type: 'special' },
  { name: 'Kentucky Avenue', price: 220, rent: [18, 90, 250, 700, 875, 1050], color: 'bg-red-600', position: 21, owner: null, houses: 0, type: 'property' },
  { name: 'Chance', price: 0, rent: [0], color: '', position: 22, owner: null, houses: 0, type: 'special' },
  { name: 'Indiana Avenue', price: 220, rent: [18, 90, 250, 700, 875, 1050], color: 'bg-red-600', position: 23, owner: null, houses: 0, type: 'property' },
  { name: 'Illinois Avenue', price: 240, rent: [20, 100, 300, 750, 925, 1100], color: 'bg-red-600', position: 24, owner: null, houses: 0, type: 'property' },
  { name: 'B. & O. Railroad', price: 200, rent: [25, 50, 100, 200], color: '', position: 25, owner: null, houses: 0, type: 'railroad' },
  { name: 'Atlantic Avenue', price: 260, rent: [22, 110, 330, 800, 975, 1150], color: 'bg-yellow-500', position: 26, owner: null, houses: 0, type: 'property' },
  { name: 'Ventnor Avenue', price: 260, rent: [22, 110, 330, 800, 975, 1150], color: 'bg-yellow-500', position: 27, owner: null, houses: 0, type: 'property' },
  { name: 'Water Works', price: 150, rent: [0], color: '', position: 28, owner: null, houses: 0, type: 'utility' },
  { name: 'Marvin Gardens', price: 280, rent: [24, 120, 360, 850, 1025, 1200], color: 'bg-yellow-500', position: 29, owner: null, houses: 0, type: 'property' },
  { name: 'Go To Jail', price: 0, rent: [0], color: '', position: 30, owner: null, houses: 0, type: 'special' },
  { name: 'Pacific Avenue', price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: 'bg-green-600', position: 31, owner: null, houses: 0, type: 'property' },
  { name: 'North Carolina Avenue', price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: 'bg-green-600', position: 32, owner: null, houses: 0, type: 'property' },
  { name: 'Community Chest', price: 0, rent: [0], color: '', position: 33, owner: null, houses: 0, type: 'special' },
  { name: 'Pennsylvania Avenue', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], color: 'bg-green-600', position: 34, owner: null, houses: 0, type: 'property' },
  { name: 'Short Line', price: 200, rent: [25, 50, 100, 200], color: '', position: 35, owner: null, houses: 0, type: 'railroad' },
  { name: 'Chance', price: 0, rent: [0], color: '', position: 36, owner: null, houses: 0, type: 'special' },
  { name: 'Park Place', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], color: 'bg-blue-900', position: 37, owner: null, houses: 0, type: 'property' },
  { name: 'Luxury Tax', price: 0, rent: [0], color: '', position: 38, owner: null, houses: 0, type: 'special' },
  { name: 'Boardwalk', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], color: 'bg-blue-900', position: 39, owner: null, houses: 0, type: 'property' },
];

const availablePieces = ['🚗', '🎩', '🚢', '🐕', '🐈', '👞', '🎸', '⚓'];

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
          {prop.owner !== null && <div className={`w-2 h-2 rounded-full ${players[prop.owner].color} absolute top-1`}></div>}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-1 text-center leading-tight">
          <div className="font-semibold">{prop.name.split(' ')[0]}</div>
          <div className="font-semibold">{prop.name.split(' ').slice(1).join(' ')}</div>
          <div className="text-[9px] font-bold mt-1">${prop.price}</div>
        </div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map(p => (
              <div key={p.id} className="text-2xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{p.piece}</div>
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
        {prop.owner !== null && <div className={`w-2 h-2 rounded-full ${players[prop.owner].color} absolute top-1`}></div>}
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map(p => (
              <div key={p.id} className="text-2xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{p.piece}</div>
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
        {prop.owner !== null && <div className={`w-2 h-2 rounded-full ${players[prop.owner].color} absolute top-1`}></div>}
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map(p => (
              <div key={p.id} className="text-2xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{p.piece}</div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (prop.name === 'GO') {
    return (
      <div className="h-full w-full bg-red-600 border border-gray-800 flex flex-col items-center justify-center text-white font-bold relative">
        <div className="text-2xl">→</div>
        <div className="text-xs">GO</div>
        <div className="text-[8px]">COLLECT $200</div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {playersHere.map(p => (
              <div key={p.id} className="text-3xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{p.piece}</div>
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
              <div key={p.id} className="text-3xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{p.piece}</div>
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
              <div key={p.id} className="text-3xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{p.piece}</div>
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
              <div key={p.id} className="text-3xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{p.piece}</div>
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
        <div className="text-[8px] font-bold text-center leading-tight">COMMUNITY<br/>CHEST</div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map(p => (
              <div key={p.id} className="text-2xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{p.piece}</div>
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
              <div key={p.id} className="text-2xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{p.piece}</div>
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
        <div className="text-[8px] font-bold text-center leading-tight">INCOME<br/>TAX<br/>$200</div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map(p => (
              <div key={p.id} className="text-2xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{p.piece}</div>
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
        <div className="text-[8px] font-bold text-center leading-tight">LUXURY<br/>TAX<br/>$100</div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map(p => (
              <div key={p.id} className="text-2xl drop-shadow-lg filter brightness-110" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{p.piece}</div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return <div className="h-full w-full bg-white border border-gray-800"></div>;
};

export default function MonopolyGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState('');
  const [gameProperties, setGameProperties] = useState<Property[]>(properties);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [message, setMessage] = useState('Choose your piece to start!');
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(true);

  const addLog = (msg: string) => {
    setGameLog(prev => [...prev.slice(-4), msg]);
  };

  const startGame = (piece: string) => {
    const computerPiece = availablePieces.filter(p => p !== piece)[Math.floor(Math.random() * (availablePieces.length - 1))];
    setSelectedPiece(piece);
    setPlayers([
      { id: 0, name: 'You', position: 0, money: 1500, properties: [], color: 'bg-blue-600', piece: piece, isComputer: false },
      { id: 1, name: 'Computer', position: 0, money: 1500, properties: [], color: 'bg-red-600', piece: computerPiece, isComputer: true },
    ]);
    setGameStarted(true);
    setMessage('Roll the dice to start!');
  };

  const playDiceSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    setTimeout(() => {
      oscillator.frequency.value = 300;
    }, 50);
    setTimeout(() => {
      oscillator.stop();
    }, 150);
  };

  const computerTurn = () => {
    setTimeout(() => {
      rollDice();
    }, 1500);
  };

  useEffect(() => {
    if (gameStarted && players[currentPlayer]?.isComputer && canRoll && !showBuyModal) {
      computerTurn();
    }
  }, [currentPlayer, canRoll, showBuyModal, gameStarted]);

  const computerDecision = (property: Property) => {
    setTimeout(() => {
      const affordablePercent = (players[1].money - property.price) / players[1].money;
      const shouldBuy = players[1].money >= property.price && (
        property.price < 150 ? Math.random() > 0.2 :
        affordablePercent > 0.5 ? Math.random() > 0.3 :
        affordablePercent > 0.3 ? Math.random() > 0.5 :
        Math.random() > 0.7
      );
      
      if (shouldBuy) {
        addLog(`Computer is considering ${property.name}...`);
        setTimeout(() => {
          buyProperty();
        }, 800);
      } else {
        addLog(`Computer declined ${property.name}`);
        setTimeout(() => {
          skipProperty();
        }, 800);
      }
    }, 1000);
  };

  const rollDice = () => {
    if (!canRoll || isRolling) return;
    
    setIsRolling(true);
    setCanRoll(false);
    playDiceSound();
    
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    setDice([die1, die2]);
    
    setTimeout(() => {
      const newPosition = (players[currentPlayer].position + die1 + die2) % 40;
      const newPlayers = [...players];
      const player = newPlayers[currentPlayer];
      
      if (newPosition < player.position) {
        player.money += 200;
        addLog(`${player.name} passed GO! Collected $200`);
      }
      
      player.position = newPosition;
      const property = gameProperties[newPosition];
      
      if (property.name === 'Go To Jail') {
        player.position = 10;
        addLog(`${player.name} went to Jail!`);
        setMessage(`${player.name} is in Jail!`);
        setPlayers(newPlayers);
        setIsRolling(false);
        setTimeout(() => {
          setCurrentPlayer((currentPlayer + 1) % players.length);
          setCanRoll(true);
        }, 2000);
        return;
      } else if (property.name === 'Income Tax') {
        player.money -= 200;
        addLog(`${player.name} paid $200 income tax`);
        setMessage(`Paid $200 in taxes`);
      } else if (property.name === 'Luxury Tax') {
        player.money -= 100;
        addLog(`${player.name} paid $100 luxury tax`);
        setMessage(`Paid $100 luxury tax`);
      } else if (property.price > 0) {
        if (property.owner === null) {
          setCurrentProperty(property);
          setShowBuyModal(true);
          setMessage(`${property.name} is available for $${property.price}`);
          
          if (player.isComputer) {
            computerDecision(property);
          }
          
          setPlayers(newPlayers);
          setIsRolling(false);
          return;
        } else if (property.owner !== currentPlayer) {
          const rent = property.rent[property.houses];
          player.money -= rent;
          newPlayers[property.owner].money += rent;
          addLog(`${player.name} paid $${rent} rent to ${newPlayers[property.owner].name}`);
          setMessage(`Paid $${rent} rent`);
        } else {
          setMessage(`You own ${property.name}`);
        }
      } else if (property.name === 'Chance' || property.name === 'Community Chest') {
        const amount = Math.random() > 0.5 ? 50 : -50;
        player.money += amount;
        addLog(`${player.name} ${amount > 0 ? 'received' : 'paid'} $${Math.abs(amount)}`);
        setMessage(`${amount > 0 ? 'Received' : 'Paid'} $${Math.abs(amount)}`);
      }
      
      setPlayers(newPlayers);
      setIsRolling(false);
      
      setTimeout(() => {
        setCurrentPlayer((currentPlayer + 1) % players.length);
        setCanRoll(true);
      }, 2000);
    }, 800);
  };

  const buyProperty = () => {
    if (!currentProperty) return;
    
    const newPlayers = [...players];
    const player = newPlayers[currentPlayer];
    
    if (player.money >= currentProperty.price) {
      player.money -= currentProperty.price;
      player.properties.push(currentProperty.position);
      
      const newProperties = [...gameProperties];
      newProperties[currentProperty.position].owner = currentPlayer;
      setGameProperties(newProperties);
      
      addLog(`${player.name} bought ${currentProperty.name} for $${currentProperty.price}`);
      setPlayers(newPlayers);
      setMessage(`${player.name} purchased ${currentProperty.name}!`);
    } else {
      setMessage(`Not enough money!`);
    }
    
    setShowBuyModal(false);
    setCurrentProperty(null);
    setTimeout(() => {
      setCurrentPlayer((currentPlayer + 1) % players.length);
      setCanRoll(true);
    }, 1500);
  };

  const skipProperty = () => {
    if (currentProperty) {
      addLog(`${players[currentPlayer].name} skipped ${currentProperty.name}`);
    }
    setShowBuyModal(false);
    setCurrentProperty(null);
    setTimeout(() => {
      setCurrentPlayer((currentPlayer + 1) % players.length);
      setCanRoll(true);
    }, 1500);
  };

  // Consistent clockwise board sections using LIVE state (gameProperties)
  // Top row: 20 (left corner) → 21..29 → 30 (right corner) left→right
  const top = gameProperties.slice(20, 31)
  // Left column between 20 and 10 should render top→bottom as 19,18,...,11
  const left = gameProperties.slice(11, 20).slice().reverse()
  // Right column between 30 and 0 should render top→bottom as 31..39
  const right = gameProperties.slice(31, 40)
  // Bottom row left→right should be 10,9..1,0
  const bottomRow = [gameProperties[10], ...gameProperties.slice(9, 0, -1), gameProperties[0]]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 to-teal-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">MONOPOLY</h1>
          <button
            onClick={() => setShowProperties(!showProperties)}
            className="bg-white text-teal-800 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-teal-50"
          >
            <List className="w-5 h-5" />
            <span className="hidden sm:inline">Properties</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-teal-800 p-2 rounded-lg shadow-2xl">
              <div className="grid grid-cols-11 gap-0">
                <div className="col-span-1 aspect-square"><PropertySpace prop={gameProperties[20]} players={players} /></div>
                {top.slice(1).map((prop) => (
                  <div key={prop.position} className="col-span-1 aspect-square"><PropertySpace prop={prop} players={players} /></div>
                ))}
                <div className="col-span-1 aspect-square"><PropertySpace prop={gameProperties[30]} players={players} /></div>
              </div>

              <div className="grid grid-cols-11 gap-0">
                <div className="col-span-1 grid grid-rows-9 gap-0">
                  {left.map((prop) => (
                    <div key={prop.position} className="aspect-square"><PropertySpace prop={prop} players={players} /></div>
                  ))}
                </div>

                <div className="col-span-9 bg-teal-700 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
                  <div className="text-4xl sm:text-6xl font-bold text-white mb-2">M</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">MONOPOLY</div>
                  <div className="flex gap-2 sm:gap-4 mb-4">
                    {dice.map((d, i) => (
                      <div key={i} className="bg-white p-2 sm:p-3 rounded-lg shadow-lg">
                        <DiceIcon value={d} />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={rollDice}
                    disabled={!canRoll || isRolling || showBuyModal || players[currentPlayer]?.isComputer}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-lg sm:text-xl shadow-lg transition-all transform hover:scale-105 disabled:scale-100"
                  >
                    {isRolling ? 'Rolling...' : 'ROLL DICE'}
                  </button>
                  <div className="text-white text-base sm:text-lg text-center bg-teal-900 px-3 sm:px-4 py-2 rounded-lg mt-4 max-w-md">{message}</div>
                </div>

                <div className="col-span-1 grid grid-rows-9 gap-0">
                  {right.map((prop) => (
                    <div key={prop.position} className="aspect-square"><PropertySpace prop={prop} players={players} /></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-11 gap-0">
                <div className="col-span-1 aspect-square"><PropertySpace prop={gameProperties[10]} players={players} /></div>
                {bottomRow.slice(1, -1).map((prop) => (
                  <div key={prop.position} className="col-span-1 aspect-square"><PropertySpace prop={prop} players={players} /></div>
                ))}
                <div className="col-span-1 aspect-square"><PropertySpace prop={gameProperties[0]} players={players} /></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {players.map((player, idx) => (
              <div key={idx} className={`bg-white rounded-lg p-4 shadow-lg ${idx === currentPlayer ? 'ring-4 ring-yellow-400' : ''}`}>
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
                <div className="text-sm text-gray-600 mt-1">Properties: {player.properties.length}</div>
              </div>
            ))}
            
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <h3 className="font-bold mb-2">Game Log</h3>
              <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {gameLog.map((log, idx) => (
                  <div key={idx} className="text-gray-700">{log}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showBuyModal && currentProperty && !players[currentPlayer]?.isComputer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => { if (e.currentTarget === e.target) setShowBuyModal(false) }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-[92vw] sm:w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">{currentProperty.name}</h2>
            <p className="text-base sm:text-lg mb-2">Price: ${currentProperty.price}</p>
            <p className="text-gray-600 mb-4">Rent: ${currentProperty.rent[0]} (base)</p>
            <p className="text-sm text-gray-500 mb-6">Your money: ${players[currentPlayer]?.money}</p>
            <div className="flex gap-3 sm:gap-4">
              <button onClick={buyProperty} disabled={(players[currentPlayer]?.money ?? 0) < currentProperty.price} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg">
                Buy
              </button>
              <button onClick={skipProperty} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {showProperties && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={(e) => { if (e.currentTarget === e.target) setShowProperties(false) }}>
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-[96vw] sm:w-full max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold">All Properties</h2>
              <button onClick={() => setShowProperties(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-1 sm:pr-2">
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
                      {prop.owner !== null && (
                        <div className="flex flex-col items-center gap-1 ml-2">
                          <span className="text-xl sm:text-2xl">{players[prop.owner].piece}</span>
                          <span className="text-xs font-semibold text-green-700">{players[prop.owner].name}</span>
                        </div>
                      )}
                      {prop.owner === null && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">Available</span>
                      )}
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-green-600">Price: ${prop.price}</p>
                      <p className="text-gray-600">Base Rent: ${prop.rent[0]}</p>
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

