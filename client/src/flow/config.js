import { config } from "@onflow/fcl";

// Flow blockchain configuration
// Uses environment variables with testnet defaults
config({
  "accessNode.api":
    import.meta.env.VITE_FLOW_ACCESS_NODE ||
    "https://rest-testnet.onflow.org",
  "discovery.wallet":
    import.meta.env.VITE_FLOW_DISCOVERY_WALLET ||
    "https://fcl-discovery.onflow.org/testnet/authn",
});
