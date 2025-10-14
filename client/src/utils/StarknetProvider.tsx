import { sepolia, mainnet, type Chain } from "@starknet-react/chains";
import {
  StarknetConfig,
  jsonRpcProvider,
  starkscan,
} from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { FeeSource, toSessionPolicies } from "@cartridge/controller";
import { constants } from "starknet";
import { WORLD_ADDRESS } from "./constants";

// Define session policies
const policies = {
  contracts: {
    [WORLD_ADDRESS]: {
      methods: [
        {
          name: "Create Game",
          entrypoint: "create_game",
        },
        {
          name: "Join Game",
          entrypoint: "join_game",
        },
        {
          name: "Start Game",
          entrypoint: "start_game",
        },
        {
          name: "Roll Dice",
          entrypoint: "roll_dice",
        },
        {
          name: "Buy Property",
          entrypoint: "buy_property",
        },
        {
          name: "Buy House",
          entrypoint: "buy_house",
        },
        {
          name: "Sell House",
          entrypoint: "sell_house",
        },
        {
          name: "Next Turn",
          entrypoint: "next_turn",
        },
        {
          name: "Pay Rent",
          entrypoint: "pay_rent",
        },
      ],
    },
  },
};

const sessions = toSessionPolicies(policies);
// Initialize the connector
const connector = new ControllerConnector({
  policies: sessions,
  defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
  feeSource: FeeSource.PAYMASTER,
  namespace: "starkcity",
  slot: "starkcity",
  // chains: [
  //   {
  //     rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  //   },
  // ],
});

// Configure RPC provider
const provider = jsonRpcProvider({
  rpc: (chain: Chain) => {
    switch (chain) {
      case mainnet:
        return { nodeUrl: "https://api.cartridge.gg/x/starknet/mainnet" };
      case sepolia:
      default:
        return { nodeUrl: "https://api.cartridge.gg/x/starknet/sepolia" };
    }
  },
});

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      autoConnect
      chains={[sepolia, mainnet]}
      provider={provider}
      connectors={[connector]}
      explorer={starkscan}
    >
      {children}
    </StarknetConfig>
  );
}
