import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { defaultBoard } from './board'
import type { GameState, Player, Token } from './types'

interface GameContextValue extends GameState {
  rollDice: () => void
  endTurn: () => void
  buyProperty: () => void
  startNewGame: (options: { vsComputer: boolean; playerTokens: Token[] }) => void
}

const startingMoney = 1500

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => ({
    tiles: defaultBoard,
    players: [],
    currentPlayerId: 0,
    dice: null,
    hasRolled: false,
    winnerId: null,
  }))

  const startNewGame = (options: { vsComputer: boolean; playerTokens: Token[] }) => {
    const players: Player[] = [
      { id: 0, name: 'Player 1', token: options.playerTokens[0], position: 0, money: startingMoney, inJail: false, jailTurns: 0, isComputer: false },
      { id: 1, name: options.vsComputer ? 'Computer' : 'Player 2', token: options.playerTokens[1], position: 0, money: startingMoney, inJail: false, jailTurns: 0, isComputer: options.vsComputer },
    ]
    setState(s => ({ ...s, tiles: defaultBoard.map(t => ({ ...t, ownerId: null })), players, currentPlayerId: 0, dice: null, hasRolled: false, winnerId: null }))
  }

  const movePlayer = (player: Player, steps: number): Player => {
    let newPos = (player.position + steps) % state.tiles.length
    let money = player.money
    if (player.position + steps >= state.tiles.length) {
      money += 200 // pass GO
    }
    return { ...player, position: newPos, money }
  }

  const rollDice = () => {
    if (state.players.length === 0) return
    if (state.hasRolled || state.winnerId !== null) return
    const d1 = Math.ceil(Math.random() * 6)
    const d2 = Math.ceil(Math.random() * 6)
    const steps = d1 + d2
    setState(s => {
      const current = s.players[s.currentPlayerId]
      if (!current) return s
      const moved = movePlayer(current, steps)
      const players = s.players.map(p => (p.id === moved.id ? moved : p))
      return { ...s, players, dice: [d1, d2], hasRolled: true }
    })
  }

  const buyProperty = () => {
    setState(s => {
      const current = s.players[s.currentPlayerId]
      const tile = s.tiles[current.position]
      if (tile.type !== 'property' && tile.type !== 'railroad' && tile.type !== 'utility') return s
      if (tile.ownerId != null) return s
      if ((tile.price ?? Infinity) > current.money) return s
      const newTiles = s.tiles.slice()
      newTiles[tile.id] = { ...tile, ownerId: current.id }
      const players = s.players.map(p => (p.id === current.id ? { ...p, money: p.money - (tile.price ?? 0) } : p))
      return { ...s, tiles: newTiles, players }
    })
  }

  const resolveLanding = () => {
    setState(s => {
      const current = s.players[s.currentPlayerId]
      const tile = s.tiles[current.position]
      if (tile.type === 'gotojail') {
        const players = s.players.map(p => (p.id === current.id ? { ...p, position: 10, inJail: true, jailTurns: 3 } : p))
        return { ...s, players }
      }
      if ((tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') && tile.ownerId != null && tile.ownerId !== current.id) {
        const rent = tile.rent ?? 0
        const players = s.players.map(p => {
          if (p.id === current.id) return { ...p, money: p.money - rent }
          if (p.id === tile.ownerId) return { ...p, money: p.money + rent }
          return p
        })
        const loser = players.find(p => p.money < 0)
        const winnerId = loser ? (players.find(p => p.id !== loser.id)?.id ?? null) : s.winnerId
        return { ...s, players, winnerId: winnerId ?? null }
      }
      return s
    })
  }

  const endTurn = () => {
    setState(s => {
      const next = (s.currentPlayerId + 1) % s.players.length
      return { ...s, currentPlayerId: next, dice: null, hasRolled: false }
    })
  }

  // Side-effect like resolution
  // Simple AI: auto play when computer's turn
  useEffect(() => {
    const current = state.players[state.currentPlayerId]
    if (!current || !current.isComputer || state.winnerId !== null) return
    const t1 = setTimeout(() => {
      rollDice()
    }, 500)
    const t2 = setTimeout(() => {
      // Try to buy if possible on landing tile
      buyProperty()
      resolveLanding()
      endTurn()
    }, 1300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [state.currentPlayerId, state.players, state.winnerId, state.hasRolled])

  const value = useMemo<GameContextValue>(() => ({
    ...state,
    rollDice,
    endTurn: () => {
      resolveLanding()
      endTurn()
    },
    buyProperty,
    startNewGame,
  }), [state])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

