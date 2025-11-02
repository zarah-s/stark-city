# 🏙️ STARKCITY

#### Core Game Mechanics

- ✅ **Dice Rolling** - Contract-based randomness (online) / Local random (computer)
- ✅ **Property Trading** - Buy, sell, mortgage, unmortgage
- ✅ **Building System** - Houses (1-4) and Hotels
- ✅ **Jail System** - Roll doubles, pay $50, use jail-free cards, 3-turn limit
- ✅ **Chance & Community Chest** - 10+ unique cards with effects
- ✅ **Bankruptcy** - Auto-elimination and winner declaration
- ✅ **Turn Timer** - 30-second countdown per turn

#### UI/UX Features

- ✅ **Smooth Animations** - Dice roll, card reveals, piece movement
- ✅ **Sound Effects** - Dice, money, jail, victory sounds
- ✅ **Property Details** - Click any space for full info
- ✅ **Chat System** - Real-time messaging (online mode)
- ✅ **Rules Modal** - Complete how-to-play guide
- ✅ **Responsive Design** - Mobile-friendly interface

#### Technical Features

- ✅ **Smart Contract** - Full game logic on Starknet
- ✅ **Socket.IO Backend** - Real-time multiplayer
- ✅ **React Frontend** - Modern, responsive UI
- ✅ **NFT Integration** - Properties as ERC1155 tokens
- ✅ **State Synchronization** - Perfect sync across all layers

---

## 📊 Architecture

### Data Flow

```
┌─────────────────┐
│   FRONTEND      │
│   (React)       │
└────────┬────────┘
         │
         ├─ Computer Mode: Local logic
         │
         └─ Online Mode ─┐
                         │
                    ┌────▼───────────┐
                    │   BACKEND      │
                    │   (Socket.IO)  │
                    └────┬───────────┘
                         │
                    ┌────▼───────────┐
                    │   CONTRACT     │
                    │   (Cairo)      │
                    └────────────────┘
```

### State Management

#### Frontend State

- `players[]` - All player data
- `gameProperties[]` - All property states
- `currentPlayer` - Active player index
- `dice` - Current dice values
- `gameLog[]` - Move history

#### Backend State (per room)

- `room.players[]` - Connected players
- `room.properties[]` - Property ownership
- `room.gameStarted` - Game status
- `room.currentPlayer` - Turn index
- `room.jailTurns{}` - Jail turn tracking

#### Contract State

- `Game` - Game settings
- `Player` - Player stats
- `Property` - Property details
- `GameMove` - Move history

---

## 🎮 How to Play

### Objective

Be the last player standing by bankrupting all opponents!

### Game Setup

1. **Choose Mode**: Computer (vs AI) or Online (multiplayer)
2. **Connect Wallet**: Required for blockchain features
3. **Create/Join Room**: (Online mode only)
4. **Select Piece**: Choose your game token
5. **Start Game**: Host starts when all players ready

### Turn Flow

1. **Roll Dice** (30 second timer)

   - Click "ROLL DICE" button
   - Two dice roll automatically
   - Your piece moves the total spaces

2. **Perform Action** based on where you land:

   **🏠 Property (Unowned)**

   - Option to BUY for listed price
   - Click BUY IT or SKIP
   - If you buy, you own the property

   **🏠 Property (Owned by Opponent)**

   - Pay RENT to the owner
   - Rent increases with houses/hotels
   - No rent on mortgaged properties

   **🏠 Property (Owned by You)**

   - No action needed
   - Safe space - no rent!

   **🎴 Chance / Community Chest**

   - Draw a random card
   - Follow card instructions
   - Cards auto-execute after 3 seconds

   **💰 Tax Spaces**

   - Income Tax: Pay $200
   - Luxury Tax: Pay $100
   - Money automatically deducted

   **🚔 Go to Jail**

   - Move directly to jail
   - Do not pass GO
   - Do not collect $200

   **🅿️ Free Parking / Just Visiting**

   - Safe spaces
   - No action required

   **🎯 GO**

   - Collect $200 when you pass or land
   - Automatically added to your balance

3. **End Turn**
   - After action, turn passes to next player
   - Wait for your next turn

### Building Strategy

#### Getting a Monopoly

1. **Buy all properties of one color group**

   - Mediterranean & Baltic (Brown) - 2 properties
   - Oriental, Vermont, Connecticut (Light Blue) - 3 properties
   - St. Charles, States, Virginia (Pink) - 3 properties
   - And so on...

2. **Once you own all of a color:**
   - Click "BUILD" button (top right)
   - Select property to build on
   - Click "HOUSE $X" to buy house

#### Building Rules

- Must own complete color set (monopoly)
- Build evenly across color group
- Max 4 houses per property
- 5th building = HOTEL (replaces 4 houses)
- Cannot build on mortgaged properties
- Rent increases with each building

#### Example Building Path

```
Property: Baltic Avenue ($60)
├─ No houses: $4 rent
├─ 1 house: $20 rent
├─ 2 houses: $60 rent
├─ 3 houses: $180 rent
├─ 4 houses: $320 rent
└─ Hotel: $450 rent
```

### Money Management

#### Earning Money

- **Pass GO**: Collect $200
- **Chance/Community Chest**: Some cards give money
- **Rent Collection**: When opponents land on your properties
- **Selling Buildings**: Get 50% back

#### Spending Money

- **Buy Properties**: Pay listed price
- **Pay Rent**: Land on owned properties
- **Build Houses**: $50-$200 depending on property
- **Pay Taxes**: Income Tax ($200), Luxury Tax ($100)
- **Get Out of Jail**: Pay $50 option

#### Emergency Cash Options

1. **Mortgage Properties**

   - Click "BUILD" → Select property
   - Click "MORTGAGE $X" (get 50% of value)
   - Property marked with 🔒
   - Cannot collect rent while mortgaged
   - Unmortgage for 55% of value

2. **Sell Buildings**
   - Click "BUILD" → Select property
   - Click "SELL $X" (get 50% back)
   - Must sell evenly across color group
   - Hotels must be sold before houses

### Jail Mechanics

#### Going to Jail

You go to jail when:

- Land on "GO TO JAIL" space
- Draw "Go to Jail" card
- Roll doubles 3 times in a row (not implemented yet)

#### Getting Out of Jail

You have 4 options:

1. **Roll Doubles**

   - Roll dice on your turn
   - If both dice match, you're FREE
   - Move normally from jail

2. **Pay $50**

   - Before or after rolling
   - Immediate release
   - Continue turn normally

3. **Use "Get Out of Jail Free" Card**

   - If you have the card
   - Use anytime during jail
   - Keep card from Chance/Community Chest

4. **Wait 3 Turns**
   - After 3 failed attempts
   - MUST pay $50 to leave
   - Then roll and move

**In Jail You Can:**

- Still collect rent
- Still build houses
- Still mortgage properties
- Still make trades

**In Jail You Cannot:**

- Move around the board
- Buy properties
- Pass GO

### Special Cards

#### Chance Cards (Orange)

- Advance to GO - Collect $200
- Go to Jail - Move to jail
- Bank Error - Collect $200
- Get Out of Jail Free - Keep this card
- Pay Fines - Lose $15-$50
- Collect Money - Gain $50-$150

#### Community Chest Cards (Blue)

- Life Insurance - Collect $100
- Doctor's Fees - Pay $50
- Inherit Money - Collect $100
- Get Out of Jail Free - Keep this card
- Birthday - Collect $10
- School Fees - Pay $50

### Bankruptcy & Game End

#### Going Bankrupt

When your money goes below $0:

1. Try to mortgage properties
2. Try to sell buildings
3. If still negative = BANKRUPT
4. All properties return to bank
5. You're eliminated from game

#### Winning the Game

- Last player standing wins!
- All other players must go bankrupt
- Victory screen appears
- Trophy emoji 🏆

### Tips & Strategy

#### Early Game

- Buy every property you can afford
- Focus on completing color groups
- Save cash for emergencies
- Orange/Red properties are most landed on

#### Mid Game

- Build houses on monopolies
- Don't build too fast - keep cash
- Mortgage unused properties if needed
- Watch opponents' money

#### Late Game

- Build hotels on best properties
- Force opponents into bankruptcy
- Keep enough cash to survive rent
- Don't overextend

#### Best Properties (Statistically)

1. **Orange** - Illinois, Indiana, Kentucky
2. **Red** - Kentucky, Indiana, Illinois Avenue
3. **Yellow** - Atlantic, Ventnor, Marvin Gardens
4. **Green** - Pacific, North Carolina, Pennsylvania
5. **Railroads** - Collect $200 with all 4

#### Property Value Rankings

- **Boardwalk/Park Place** - Highest rent but expensive
- **Orange/Red** - Best ROI (return on investment)
- **Light Blue/Brown** - Cheap but low rent
- **Railroads** - Good steady income
- **Utilities** - Lowest priority

### Controls & UI

#### Main Buttons

- **🎲 ROLL DICE** - Roll and move (bottom right)
- **🏠 BUILD** - Manage your properties (top right)
- **📋 PROPS** - View all properties (top right)
- **💬 CHAT** - Send messages (online mode, top right)
- **🔊 Sound** - Toggle sound effects (top right)

#### Property Management

Click any property space to:

- View details (price, rent, owner)
- See building counts
- Check mortgage status

#### Information Displays

- **Player Cards** (right side)
  - Your money balance
  - Properties owned
  - Current turn indicator
  - Jail status
- **Game Log** (bottom right)

  - Recent moves
  - Transactions
  - Game events

- **Turn Timer** (center)
  - 30 second countdown
  - Progress bar indicator
  - Auto-skip when time's up

### Online Multiplayer

#### Creating a Game

1. Click "ONLINE"
2. Enter your name
3. Click "CREATE ROOM"
4. Share 6-digit room code
5. Wait for players (2-4 players)
6. Click "START GAME" when ready

#### Joining a Game

1. Click "ONLINE"
2. Enter your name
3. Click "JOIN ROOM"
4. Enter 6-digit room code
5. Wait for host to start

#### Room Features

- **Room Code**: 6-digit code (e.g., ABC123)
- **Max Players**: 4 players per room
- **Host Powers**: Only host can start game
- **Chat**: Send messages to all players
- **Auto-save**: Game state syncs automatically

### Computer Mode (vs AI)

#### Playing Against AI

1. Click "vs COMPUTER"
2. Choose your piece
3. Play against one AI opponent
4. AI makes decisions automatically
5. AI difficulty: Moderate

#### AI Behavior

- Buys properties strategically
- More likely to buy cheaper properties
- Considers money-to-price ratio
- Makes decisions in 1-2 seconds
- Follows same rules as human players

### Keyboard Shortcuts

- **Spacebar** - Roll dice (when your turn)
- **Escape** - Close open modal
- **Enter** - Send chat message

---

## 🔌 API Endpoints

### Backend REST APIs

```
GET  /health  - Server health check
GET  /stats   - Room statistics
```

### Socket.IO Events

#### Client → Server

- `joinRoom` - Join game room
- `startGame` - Start game (host only)
- `rollDice` - Roll dice
- `buyProperty` - Purchase property
- `skipProperty` - Skip purchase
- `buyHouse` - Build house/hotel
- `sellHouse` - Sell building
- `mortgageProperty` - Mortgage property
- `unmortgageProperty` - Unmortgage property
- `chat` - Send chat message
- `skipTurn` - Skip turn (timeout)

#### Server → Client

- `roomJoined` - Successful room join
- `playerJoined` - New player joined
- `gameStarted` - Game began
- `fullGameState` - Complete state sync
- `diceRolled` - Dice results
- `playerMoved` - Player moved
- `cardDrawn` - Card drawn
- `propertyLanded` - Landed on property
- `propertyPurchased` - Property bought
- `houseBought` - Building built
- `houseSold` - Building sold
- `propertyMortgaged` - Property mortgaged
- `propertyUnmortgaged` - Property unmortgaged
- `playerBankrupt` - Player eliminated
- `gameWon` - Game over
- `turnChanged` - Next player's turn
- `chat` - Chat message
- `error` - Error occurred

---

## 🛡️ Security Considerations

### Contract Security

- ✅ On-chain randomness using block data
- ✅ Ownership verification for all actions
- ✅ Monopoly validation before building
- ✅ Bankruptcy handling with property return

### Backend Security

- ✅ Room code validation
- ✅ Player authentication via socket ID
- ✅ Turn validation (correct player)
- ✅ Action validation (sufficient funds, ownership)
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: Input sanitization
- ⚠️ TODO: CORS configuration for production

### Frontend Security

- ✅ Wallet connection required
- ✅ Transaction signing for all contract calls
- ✅ Local state validation
- ⚠️ TODO: XSS protection in chat
- ⚠️ TODO: Input validation

---

## 🐛 Known Issues & TODOs

### High Priority

- [ ] Implement reconnection after disconnect
- [ ] Add spectator mode
- [ ] Implement trading system between players
- [ ] Add auction system for declined properties
- [ ] Better error handling and user feedback

### Medium Priority

- [ ] Save game state to database
- [ ] Add game replay feature
- [ ] Implement achievement system
- [ ] Add leaderboard/stats tracking
- [ ] Mobile app version

### Low Priority

- [ ] Custom property themes
- [ ] Animated piece movement
- [ ] Background music
- [ ] Multiple language support
- [ ] Dark/light mode toggle

---

## 📈 Performance Optimization

### Frontend

- Memoize expensive calculations
- Lazy load property modals
- Optimize re-renders with React.memo
- Use Web Workers for complex logic

### Backend

- Implement Redis for session storage
- Add connection pooling
- Cache frequently accessed data
- Horizontal scaling with multiple instances

### Contract

- Batch property initialization
- Optimize storage reads
- Use events efficiently
- Minimize on-chain computations

---

## 🎉 Acknowledgments

- Starknet for blockchain infrastructure
- Dojo Engine for game framework

---

**Happy Building! 🏗️🎲**
