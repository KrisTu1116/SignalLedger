import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import SignalLedgerArtifact from "../../../contracts/artifacts/contracts/SignalLedger.sol/SignalLedger.json";

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

export const SIGNAL_LEDGER_ABI = SignalLedgerArtifact.abi;

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

export async function disputeMarket(
  user: DemoUser,
  marketId: bigint,
  reason: string
) {
  return write(user, "disputeMarket", [marketId, reason]);
}

export async function readAuditEvents() {
  const pub = getPublicClient();

  const eventNames = [
    "UserRegistered",
    "MarketCreated",
    "TradePlaced",
    "MarketSettled",
    "Redeemed",
    "RequestCreated",
    "StakedForRequest",
    "RequestActivated",
    "DisputeLogged",
  ];

  const latestBlock = await pub.getBlockNumber();

  const allEvents: {
    eventName: string;
    blockNumber?: bigint;
    transactionHash?: string;
    args?: unknown;
  }[] = [];

  for (const eventName of eventNames) {
    try {
      const logs = await pub.getContractEvents({
        address: contractAddress,
        abi: SIGNAL_LEDGER_ABI,
        eventName: eventName as any,
        fromBlock: 0n,
        toBlock: latestBlock,
      });

      for (const log of logs as any[]) {
        allEvents.push({
          eventName,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          args: log.args,
        });
      }
    } catch (err) {
      console.warn(`Failed to load ${eventName}`, err);
    }
  }

  return allEvents.sort((a, b) =>
    Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n))
  );
}