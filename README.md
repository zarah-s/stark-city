# 🏙️ StarkCity

**StarkCity** is an onchain reimagination of _Monopoly_ — built on **Starknet** using **Dojo**.  
Buy, trade, and build your empire in a decentralized city where every roll, deal, and rent payment is verifiable onchain.

> 🎯 **Catchphrase:** Own the blockchain streets.

---

## 🌟 Overview

**StarkCity** combines the strategy of Monopoly with the transparency of blockchain.  
It offers two modes of play:

- 🧑‍🤝‍🧑 **Online Multiplayer:** Compete with other players via real-time socket connections.
- 🤖 **AI Mode:** Play against a computer opponent that makes strategic decisions based on rule-based heuristics.

Every property, house, and hotel exists as an **ERC-1155 token**, ensuring ownership and progression are fully onchain and transparent.

---

## 🧠 Inspiration

We wanted to take a timeless game — _Monopoly_ — and rebuild it for the decentralized era.  
Traditional Monopoly depends on trust; **StarkCity** replaces that with cryptographic fairness.  
Every action, from dice rolls to rent collection, is recorded on Starknet for anyone to verify.

---

## ⚙️ How It Works

### 🎮 Game Flow

1. Players roll dice to move around the board.
2. Landing on an unowned property allows purchase.
3. Rent is automatically transferred when another player lands on an owned property.
4. Build houses or hotels using ERC-1155 tokens.
5. Last player standing wins the city!

### 🧩 Token Structure

| Asset Type | Token ID Range | Example                         | Description         |
| ---------- | -------------- | ------------------------------- | ------------------- |
| Property   | `1–40`         | `1` → Mediterranean Ave         | Base properties     |
| House      | `1001–1040`    | `1001` → House on Mediterranean | Houses per property |
| Hotel      | `2001–2040`    | `2039` → Hotel on Boardwalk     | Replaces 4 houses   |

Each property has a deterministic relationship:

```
property_id = 1–40
house_id = 1000 + property_id
hotel_id = 2000 + property_id
```

### ⚙️ Architecture Overview

- **Smart Contracts:**  
  Built in **Cairo**, structured using **Dojo ECS**.  
  Components: `Player`, `PropertyOwnership`, `GameState`, etc.  
  Systems: `RollDiceSystem`, `BuyPropertySystem`, `BuildHouseSystem`, `PayRentSystem`.

- **Server:**  
  Built with **Node.js** and **Socket.IO** to manage multiplayer rooms, turns, and state sync.

- **Frontend:**  
  Built with **React + TypeScript** for responsive and interactive gameplay.

- **AI Mode:**  
  A local rule-based engine that simulates an opponent with predictable but strategic decisions.

---

## 🧠 Tech Stack

- **Cairo** – Smart contracts for Starknet
- **Dojo** – ECS framework for game logic
- **React** – Frontend framework
- **TypeScript** – Client and server logic
- **Node.js** – Backend server runtime
- **Socket.IO** – Real-time multiplayer communication
- **ERC-1155** – Token standard for in-game assets
- **Starknet.js** – For contract interaction
- **Torii** – Dojo indexer for offchain state queries
- **Katana** – Local Starknet devnet for testing
- **Vercel** – Frontend deployment

---

## 🧩 Challenges We Faced

- Synchronizing onchain and offchain game states in real time.
- Designing an efficient ERC-1155 hierarchy for properties, houses, and hotels.
- Balancing decentralization with responsive gameplay.
- Integrating AI behavior into onchain turn logic.

---

## 🏆 Accomplishments

- Built a **fully onchain Monopoly experience** using Dojo on Starknet.
- Designed an elegant ERC-1155 asset mapping system.
- Integrated both **AI and multiplayer** modes seamlessly.
- Created a foundation for an expandable onchain city ecosystem.

---

## 📚 What We Learned

- How to structure complex games using **Dojo ECS**.
- Techniques for bridging **offchain interactivity** with **onchain verification**.
- The importance of **UX and state synchronization** in blockchain gaming.

---

## 🚀 What’s Next

- 🏆 **Leaderboard Integration** on Starknet
- 💰 **Staking & Tokenized Rewards** for players
- 🏙️ **Custom Boards and Community Events**
- 🌍 **Open Economy:** Trade properties and assets across games

---
