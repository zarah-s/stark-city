import { useState } from 'react'
import { useGame } from '../game/state'
import type { Token } from '../game/types'

const tokens: Token[] = ['car', 'hat', 'dog', 'ship', 'shoe', 'iron', 'thimble', 'wheelbarrow']

function tokenEmoji(token: Token) {
  switch (token) {
    case 'car': return '🚗'
    case 'hat': return '🎩'
    case 'dog': return '🐶'
    case 'ship': return '🚢'
    case 'shoe': return '👟'
    case 'iron': return '🪙'
    case 'thimble': return '🧵'
    case 'wheelbarrow': return '🛒'
    default: return '⚪'
  }
}

export default function Setup() {
  const { startNewGame, players } = useGame()
  const [vsComputer, setVsComputer] = useState(true)
  const [p1, setP1] = useState<Token>('car')
  const [p2, setP2] = useState<Token>('hat')

  if (players.length >= 2) return null

  return (
    <div className="card p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold">New Game</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={vsComputer} onChange={e => setVsComputer(e.target.checked)} />
            <span>Vs Computer</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="mb-2 font-medium">Player 1 Token</div>
          <div className="grid grid-cols-4 gap-2">
            {tokens.map(t => (
              <button key={t} className={`btn ${p1 === t ? '' : 'btn-outline'}`} onClick={() => setP1(t)}>
                <span>{tokenEmoji(t)}</span>
                <span className="text-sm capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 font-medium">{vsComputer ? 'Computer Token' : 'Player 2 Token'}</div>
          <div className="grid grid-cols-4 gap-2">
            {tokens.filter(t => t !== p1).map(t => (
              <button key={t} className={`btn ${p2 === t ? '' : 'btn-outline'}`} onClick={() => setP2(t)}>
                <span>{tokenEmoji(t)}</span>
                <span className="text-sm capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn" onClick={() => startNewGame({ vsComputer, playerTokens: [p1, p2] })}>Start</button>
      </div>
    </div>
  )
}

