import { DojoProvider, type DojoCall } from "@dojoengine/core";
import {
  Account,
  AccountInterface,
  type BigNumberish,
  CairoOption,
  CairoCustomEnum,
} from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {
  const build_actions_buyHouse_calldata = (
    gameId: BigNumberish,
    position: BigNumberish
  ): DojoCall => {
    return {
      contractName: "actions",
      entrypoint: "buy_house",
      calldata: [gameId, position],
    };
  };

  const actions_buyHouse = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish,
    position: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount as any,
        build_actions_buyHouse_calldata(gameId, position),
        "starkcity"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_actions_buyProperty_calldata = (
    gameId: BigNumberish,
    position: BigNumberish
  ): DojoCall => {
    return {
      contractName: "actions",
      entrypoint: "buy_property",
      calldata: [gameId, position],
    };
  };

  const actions_buyProperty = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish,
    position: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount as any,
        build_actions_buyProperty_calldata(gameId, position),
        "starkcity"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_actions_createGame_calldata = (
    gameId: BigNumberish
  ): DojoCall => {
    return {
      contractName: "actions",
      entrypoint: "create_game",
      calldata: [gameId],
    };
  };

  const actions_createGame = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount as any,
        build_actions_createGame_calldata(gameId),
        "starkcity"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_actions_joinGame_calldata = (
    gameId: BigNumberish,
    piece: BigNumberish
  ): DojoCall => {
    return {
      contractName: "actions",
      entrypoint: "join_game",
      calldata: [gameId, piece],
    };
  };

  const actions_joinGame = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish,
    piece: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount as any,
        build_actions_joinGame_calldata(gameId, piece),
        "starkcity"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_actions_nextTurn_calldata = (gameId: BigNumberish): DojoCall => {
    return {
      contractName: "actions",
      entrypoint: "next_turn",
      calldata: [gameId],
    };
  };

  const actions_nextTurn = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount as any,
        build_actions_nextTurn_calldata(gameId),
        "starkcity"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_actions_payRent_calldata = (
    gameId: BigNumberish,
    propertyPosition: BigNumberish
  ): DojoCall => {
    return {
      contractName: "actions",
      entrypoint: "pay_rent",
      calldata: [gameId, propertyPosition],
    };
  };

  const actions_payRent = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish,
    propertyPosition: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount as any,
        build_actions_payRent_calldata(gameId, propertyPosition),
        "starkcity"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_actions_rollDice_calldata = (
    gameId: BigNumberish,
    dice1: BigNumberish,
    dice2: BigNumberish
  ): DojoCall => {
    return {
      contractName: "actions",
      entrypoint: "roll_dice",
      calldata: [gameId, dice1, dice2],
    };
  };

  const actions_rollDice = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish,
    dice1: BigNumberish,
    dice2: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount as any,
        build_actions_rollDice_calldata(gameId, dice1, dice2),
        "starkcity"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_actions_sellHouse_calldata = (
    gameId: BigNumberish,
    position: BigNumberish
  ): DojoCall => {
    return {
      contractName: "actions",
      entrypoint: "sell_house",
      calldata: [gameId, position],
    };
  };

  const actions_sellHouse = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish,
    position: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount as any,
        build_actions_sellHouse_calldata(gameId, position),
        "starkcity"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_actions_startGame_calldata = (gameId: BigNumberish): DojoCall => {
    return {
      contractName: "actions",
      entrypoint: "start_game",
      calldata: [gameId],
    };
  };

  const actions_startGame = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount as any,
        build_actions_startGame_calldata(gameId),
        "starkcity"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return {
    actions: {
      buyHouse: actions_buyHouse,
      buildBuyHouseCalldata: build_actions_buyHouse_calldata,
      buyProperty: actions_buyProperty,
      buildBuyPropertyCalldata: build_actions_buyProperty_calldata,
      createGame: actions_createGame,
      buildCreateGameCalldata: build_actions_createGame_calldata,
      joinGame: actions_joinGame,
      buildJoinGameCalldata: build_actions_joinGame_calldata,
      nextTurn: actions_nextTurn,
      buildNextTurnCalldata: build_actions_nextTurn_calldata,
      payRent: actions_payRent,
      buildPayRentCalldata: build_actions_payRent_calldata,
      rollDice: actions_rollDice,
      buildRollDiceCalldata: build_actions_rollDice_calldata,
      sellHouse: actions_sellHouse,
      buildSellHouseCalldata: build_actions_sellHouse_calldata,
      startGame: actions_startGame,
      buildStartGameCalldata: build_actions_startGame_calldata,
    },
  };
}
