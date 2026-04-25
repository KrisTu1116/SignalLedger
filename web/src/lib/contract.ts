import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const hardhatChain = defineChain({
  id: 31337,
  name: "Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
});

const transport = http("http://127.0.0.1:8545");

// Hardhat default accounts (deterministic for local demo — not real keys)
const DEMO_ACCOUNTS = {
  Admin: {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as Address,
    key: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  Alice: {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address,
    key: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  Bob: {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as Address,
    key: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
  Carol: {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" as Address,
    key: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  },
} as const;

export type DemoUser = "Alice" | "Bob" | "Carol";
export const DEMO_USERS: DemoUser[] = ["Alice", "Bob", "Carol"];

export function getDemoAddress(user: DemoUser): Address {
  return DEMO_ACCOUNTS[user].address;
}

export function getAdminAddress(): Address {
  return DEMO_ACCOUNTS.Admin.address;
}

const DEFAULT_CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address;

let contractAddress: Address = DEFAULT_CONTRACT_ADDRESS;

export function setContractAddress(addr: Address) {
  contractAddress = addr;
}
export function getContractAddress(): Address {
  return contractAddress;
}

export const SIGNAL_LEDGER_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "marketId", type: "uint256" }], name: "MarketCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "marketId", type: "uint256" }, { indexed: false, internalType: "uint256", name: "actualValue", type: "uint256" }, { indexed: false, internalType: "enum SignalLedger.Outcome", name: "winningOutcome", type: "uint8" }], name: "MarketSettled", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "user", type: "address" }, { indexed: true, internalType: "uint256", name: "marketId", type: "uint256" }, { indexed: false, internalType: "uint256", name: "payout", type: "uint256" }], name: "Redeemed", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "requestId", type: "uint256" }], name: "RequestActivated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "requestId", type: "uint256" }, { indexed: false, internalType: "string", name: "question", type: "string" }], name: "RequestCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "user", type: "address" }, { indexed: true, internalType: "uint256", name: "requestId", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "StakedForRequest", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "user", type: "address" }, { indexed: true, internalType: "uint256", name: "marketId", type: "uint256" }, { indexed: false, internalType: "bool", name: "isYes", type: "bool" }, { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }, { indexed: false, internalType: "uint256", name: "cost", type: "uint256" }], name: "TradePlaced", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "user", type: "address" }], name: "UserRegistered", type: "event" },
  { inputs: [], name: "ACTIVATION_THRESHOLD", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "BPS", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "INITIAL_CREDITS", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "VIRTUAL_LIQUIDITY", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "admin", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }, { internalType: "uint256", name: "_shares", type: "uint256" }], name: "buyNo", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }, { internalType: "uint256", name: "_shares", type: "uint256" }], name: "buyYes", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "string", name: "_question", type: "string" }, { internalType: "string", name: "_locationName", type: "string" }, { internalType: "string", name: "_metricName", type: "string" }, { internalType: "uint256", name: "_threshold", type: "uint256" }, { internalType: "uint256", name: "_startTime", type: "uint256" }, { internalType: "uint256", name: "_endTime", type: "uint256" }, { internalType: "string", name: "_settlementSource", type: "string" }], name: "createMarket", outputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "string", name: "_question", type: "string" }], name: "createMarketRequest", outputs: [{ internalType: "uint256", name: "requestId", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "credits", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }], name: "getCurrentPrices", outputs: [{ internalType: "uint256", name: "yesPriceBps", type: "uint256" }, { internalType: "uint256", name: "noPriceBps", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }], name: "getMarket", outputs: [{ internalType: "string", name: "question", type: "string" }, { internalType: "string", name: "locationName", type: "string" }, { internalType: "string", name: "metricName", type: "string" }, { internalType: "uint256", name: "threshold", type: "uint256" }, { internalType: "uint256", name: "startTime", type: "uint256" }, { internalType: "uint256", name: "endTime", type: "uint256" }, { internalType: "string", name: "settlementSource", type: "string" }, { internalType: "enum SignalLedger.MarketStatus", name: "status", type: "uint8" }, { internalType: "uint256", name: "actualValue", type: "uint256" }, { internalType: "enum SignalLedger.Outcome", name: "winningOutcome", type: "uint8" }, { internalType: "uint256", name: "yesDemand", type: "uint256" }, { internalType: "uint256", name: "noDemand", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }], name: "getMarketRequest", outputs: [{ internalType: "string", name: "question", type: "string" }, { internalType: "address", name: "creator", type: "address" }, { internalType: "uint256", name: "totalStake", type: "uint256" }, { internalType: "bool", name: "activated", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "_user", type: "address" }], name: "getUserBalance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "_user", type: "address" }, { internalType: "uint256", name: "_marketId", type: "uint256" }], name: "getUserPosition", outputs: [{ internalType: "uint256", name: "yes", type: "uint256" }, { internalType: "uint256", name: "no", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "marketCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "uint256", name: "", type: "uint256" }], name: "noShares", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }], name: "redeem", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "uint256", name: "", type: "uint256" }], name: "redeemed", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "register", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "registered", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "requestCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }, { internalType: "uint256", name: "_actualValue", type: "uint256" }], name: "settleMarket", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }, { internalType: "uint256", name: "_amount", type: "uint256" }], name: "stakeForRequest", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "uint256", name: "", type: "uint256" }], name: "userStake", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "uint256", name: "", type: "uint256" }], name: "yesShares", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

// ── Clients ──

function getPublicClient() {
  return createPublicClient({ chain: hardhatChain, transport });
}

function getAccount(user: DemoUser | "Admin") {
  return privateKeyToAccount(DEMO_ACCOUNTS[user].key);
}

function getWalletClient(user: DemoUser | "Admin") {
  return createWalletClient({
    account: getAccount(user),
    chain: hardhatChain,
    transport,
  });
}

async function write(
  user: DemoUser | "Admin",
  functionName: string,
  args: unknown[] = [],
) {
  const wallet = getWalletClient(user);
  const pub = getPublicClient();
  const { request } = await pub.simulateContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: functionName as "register",
    args: args as [],
    account: getAccount(user),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hash = await wallet.writeContract(request as any);
  await pub.waitForTransactionReceipt({ hash });
  return hash;
}

// ── Read helpers ──

export async function readMarket(marketId: bigint) {
  const pub = getPublicClient();
  return pub.readContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: "getMarket",
    args: [marketId],
  });
}

export async function readPrices(marketId: bigint) {
  const pub = getPublicClient();
  return pub.readContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: "getCurrentPrices",
    args: [marketId],
  });
}

export async function readBalance(user: Address) {
  const pub = getPublicClient();
  return pub.readContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: "getUserBalance",
    args: [user],
  });
}

export async function readPosition(user: Address, marketId: bigint) {
  const pub = getPublicClient();
  return pub.readContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: "getUserPosition",
    args: [user, marketId],
  });
}

export async function readRegistered(user: Address) {
  const pub = getPublicClient();
  return pub.readContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: "registered",
    args: [user],
  });
}

export async function readMarketCount() {
  const pub = getPublicClient();
  return pub.readContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: "marketCount",
  });
}

export async function readRedeemed(user: Address, marketId: bigint) {
  const pub = getPublicClient();
  return pub.readContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: "redeemed",
    args: [user, marketId],
  });
}

export async function readMarketRequest(requestId: bigint) {
  const pub = getPublicClient();
  return pub.readContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: "getMarketRequest",
    args: [requestId],
  });
}

export async function readRequestCount() {
  const pub = getPublicClient();
  return pub.readContract({
    address: contractAddress,
    abi: SIGNAL_LEDGER_ABI,
    functionName: "requestCount",
  });
}

// ── Write helpers ──

export async function registerUser(user: DemoUser) {
  return write(user, "register");
}

export async function buyYes(user: DemoUser, marketId: bigint, shares: bigint) {
  return write(user, "buyYes", [marketId, shares]);
}

export async function buyNo(user: DemoUser, marketId: bigint, shares: bigint) {
  return write(user, "buyNo", [marketId, shares]);
}

export async function settleMarket(marketId: bigint, actualValue: bigint) {
  return write("Admin", "settleMarket", [marketId, actualValue]);
}

export async function redeemShares(user: DemoUser, marketId: bigint) {
  return write(user, "redeem", [marketId]);
}

export async function createMarketRequest(user: DemoUser, question: string) {
  return write(user, "createMarketRequest", [question]);
}

export async function stakeForRequest(
  user: DemoUser,
  requestId: bigint,
  amount: bigint,
) {
  return write(user, "stakeForRequest", [requestId, amount]);
}
