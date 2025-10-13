import { useGame } from '../game/state'

export default function Controls() {
  const { rollDice, endTurn, buyProperty, dice, hasRolled, winnerId, players, currentPlayerId } = useGame()
  const current = players[currentPlayerId]
  return (
    <div className="card p-3 flex flex-wrap items-center gap-2 justify-between">
      <div className="flex items-center gap-3">
        <div className="pill">Turn: {current?.name}</div>
        {dice && (
          <div className="pill">Dice: {dice[0]} + {dice[1]} = {dice[0] + dice[1]}</div>
        )}
        {winnerId != null && <div className="pill bg-green-500 text-white">Winner: {players.find(p => p.id === winnerId)?.name}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn" onClick={rollDice} disabled={hasRolled || winnerId != null}>Roll</button>
        <button className="btn btn-outline" onClick={buyProperty} disabled={!hasRolled || winnerId != null}>Buy</button>
        <button className="btn" onClick={endTurn} disabled={!hasRolled}>End Turn</button>
      </div>
    </div>
  )
}

