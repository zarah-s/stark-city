import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { StarknetProvider } from "./utils/StarknetProvider.tsx";
// Dojo imports
import { init } from "@dojoengine/sdk";
import { DojoSdkProvider } from "@dojoengine/sdk/react";

// Local imports
import { setupWorld } from "./bindings/typescript/contracts.gen.ts";
import type { SchemaType } from "./bindings/typescript/models.gen.ts";
import { dojoConfig } from "./utils/dojoConfig.ts";
async function main() {
  // Initialize the SDK with configuration options
  const sdk = await init<SchemaType>({
    client: {
      // Required: Address of the deployed World contract
      worldAddress: dojoConfig.manifest.world.address,
      // Optional: Torii indexer URL (defaults to http://localhost:8080)
      toriiUrl: dojoConfig.toriiUrl || "http://localhost:8080",
      // Optional: Relay URL for real-time messaging
      // relayUrl: dojoConfig.relayUrl || "/ip4/127.0.0.1/tcp/9090",
    },
    // Domain configuration for typed message signing (SNIP-12)
    domain: {
      name: "starkcity",
      version: "1.0",
      chainId: "SN_SEPOLIA", // or "SN_MAIN", "SN_SEPOLIA", "KATANA"
      revision: "1",
    },
  });

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <StarknetProvider>
        <DojoSdkProvider
          sdk={sdk}
          dojoConfig={dojoConfig}
          clientFn={setupWorld}
        >
          <App />
        </DojoSdkProvider>
      </StarknetProvider>
    </StrictMode>
  );
}

main();
