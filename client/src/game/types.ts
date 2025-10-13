export type Token = 'car' | 'hat' | 'dog' | 'ship' | 'shoe' | 'iron' | 'thimble' | 'wheelbarrow'

export type TileType = 'go' | 'property' | 'chance' | 'chest' | 'tax' | 'jail' | 'gotojail' | 'freeparking' | 'utility' | 'railroad'

export interface Tile {
  id: number
  name: string
  type: TileType
  color?: string
  price?: number
  rent?: number
  ownerId?: number | null
}

export interface Player {
  id: number
  name: string
  token: Token
  position: number
  money: number
  inJail: boolean
  jailTurns: number
  isComputer: boolean
}

export interface GameState {
  tiles: Tile[]
  players: Player[]
  currentPlayerId: number
  dice: [number, number] | null
  hasRolled: boolean
  winnerId: number | null
}

