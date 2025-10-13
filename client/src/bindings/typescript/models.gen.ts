import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import type { BigNumberish } from "starknet";

// Type definition for `starkcity::models::Game` struct
export interface Game {
  game_id: BigNumberish;
  host: string;
  started: boolean;
  current_player: BigNumberish;
  player_count: BigNumberish;
  winner: string;
}

// Type definition for `starkcity::models::GameMove` struct
export interface GameMove {
  game_id: BigNumberish;
  move_id: BigNumberish;
  player: string;
  dice1: BigNumberish;
  dice2: BigNumberish;
  new_position: BigNumberish;
  timestamp: BigNumberish;
}

// Type definition for `starkcity::models::Player` struct
export interface Player {
  game_id: BigNumberish;
  player_address: string;
  player_id: BigNumberish;
  position: BigNumberish;
  money: BigNumberish;
  piece: BigNumberish;
  is_active: boolean;
}

// Type definition for `starkcity::models::Property` struct
export interface Property {
  game_id: BigNumberish;
  position: BigNumberish;
  owner: string;
  houses: BigNumberish;
  price: BigNumberish;
  rent_base: BigNumberish;
  house_price: BigNumberish;
  color_group: BigNumberish;
}

// Type definition for `starkcity::systems::actions::actions::DiceRolled` struct
export interface DiceRolled {
  game_id: BigNumberish;
  player: string;
  dice1: BigNumberish;
  dice2: BigNumberish;
}

// Type definition for `starkcity::systems::actions::actions::GameCreated` struct
export interface GameCreated {
  game_id: BigNumberish;
  host: string;
}

// Type definition for `starkcity::systems::actions::actions::GameStarted` struct
export interface GameStarted {
  game_id: BigNumberish;
  started: boolean;
}

// Type definition for `starkcity::systems::actions::actions::HouseBought` struct
export interface HouseBought {
  game_id: BigNumberish;
  player: string;
  position: BigNumberish;
  houses: BigNumberish;
}

// Type definition for `starkcity::systems::actions::actions::HouseSold` struct
export interface HouseSold {
  game_id: BigNumberish;
  player: string;
  position: BigNumberish;
  houses: BigNumberish;
  price: BigNumberish;
}

// Type definition for `starkcity::systems::actions::actions::PlayerJoined` struct
export interface PlayerJoined {
  game_id: BigNumberish;
  player: string;
  player_id: BigNumberish;
}

// Type definition for `starkcity::systems::actions::actions::PropertyPurchased` struct
export interface PropertyPurchased {
  game_id: BigNumberish;
  player: string;
  position: BigNumberish;
  price: BigNumberish;
}

// Type definition for `starkcity::systems::actions::actions::RentPaid` struct
export interface RentPaid {
  game_id: BigNumberish;
  from: string;
  to: string;
  amount: BigNumberish;
  position: BigNumberish;
}

// Type definition for `starkcity::systems::actions::actions::TurnChanged` struct
export interface TurnChanged {
  game_id: BigNumberish;
  current_player: BigNumberish;
}

export interface SchemaType extends ISchemaType {
  starkcity: {
    Game: Game;
    GameMove: GameMove;
    Player: Player;
    Property: Property;
    DiceRolled: DiceRolled;
    GameCreated: GameCreated;
    GameStarted: GameStarted;
    HouseBought: HouseBought;
    HouseSold: HouseSold;
    PlayerJoined: PlayerJoined;
    PropertyPurchased: PropertyPurchased;
    RentPaid: RentPaid;
    TurnChanged: TurnChanged;
  };
}
export const schema: SchemaType = {
  starkcity: {
    Game: {
      game_id: 0,
      host: "",
      started: false,
      current_player: 0,
      player_count: 0,
      winner: "",
    },
    GameMove: {
      game_id: 0,
      move_id: 0,
      player: "",
      dice1: 0,
      dice2: 0,
      new_position: 0,
      timestamp: 0,
    },
    Player: {
      game_id: 0,
      player_address: "",
      player_id: 0,
      position: 0,
      money: 0,
      piece: 0,
      is_active: false,
    },
    Property: {
      game_id: 0,
      position: 0,
      owner: "",
      houses: 0,
      price: 0,
      rent_base: 0,
      house_price: 0,
      color_group: 0,
    },
    DiceRolled: {
      game_id: 0,
      player: "",
      dice1: 0,
      dice2: 0,
    },
    GameCreated: {
      game_id: 0,
      host: "",
    },
    GameStarted: {
      game_id: 0,
      started: false,
    },
    HouseBought: {
      game_id: 0,
      player: "",
      position: 0,
      houses: 0,
    },
    HouseSold: {
      game_id: 0,
      player: "",
      position: 0,
      houses: 0,
      price: 0,
    },
    PlayerJoined: {
      game_id: 0,
      player: "",
      player_id: 0,
    },
    PropertyPurchased: {
      game_id: 0,
      player: "",
      position: 0,
      price: 0,
    },
    RentPaid: {
      game_id: 0,
      from: "",
      to: "",
      amount: 0,
      position: 0,
    },
    TurnChanged: {
      game_id: 0,
      current_player: 0,
    },
  },
};
export enum ModelsMapping {
  Game = "starkcity-Game",
  GameMove = "starkcity-GameMove",
  Player = "starkcity-Player",
  Property = "starkcity-Property",
  DiceRolled = "starkcity-DiceRolled",
  GameCreated = "starkcity-GameCreated",
  GameStarted = "starkcity-GameStarted",
  HouseBought = "starkcity-HouseBought",
  HouseSold = "starkcity-HouseSold",
  PlayerJoined = "starkcity-PlayerJoined",
  PropertyPurchased = "starkcity-PropertyPurchased",
  RentPaid = "starkcity-RentPaid",
  TurnChanged = "starkcity-TurnChanged",
}
