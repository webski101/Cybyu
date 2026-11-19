import {
  createClient,
  createCrossVMClient,
  getCrossVmParams,
  type QoreChainClient,
} from "@qorechain/sdk";
import { encodeFunctionData } from "viem";

/** Live allowlisted Native targets on qorechain-diana (read 19 Nov 2026). */
export const FALLBACK_ALLOWLIST = [
  "qor14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s93uuqt", // WDT cw20
  "qor1ufs3tlq4umljk0qfe8k5ya0x6hpavn897u2cnf9k0en9jr7qarqqmjalsd",
  "qor1nc5tatafv6eyq7llkr2gv50ff9e22mnf70qgjlv737ktmt4eswrqfye7zd",
] as const;

export const WDT_CW20 = FALLBACK_ALLOWLIST[0];

export const CROSSVM_BRIDGE =
  "0x0000000000000000000000000000000000000901" as const;
export const PQC_VERIFY =
  "0x0000000000000000000000000000000000000a01" as const;
export const PQC_KEY_STATUS =
  "0x0000000000000000000000000000000000000a02" as const;

export const REST_URL = import.meta.env.VITE_QORE_REST_URL ?? "/lcd";
export const EVM_RPC =
  import.meta.env.VITE_QORE_EVM_RPC_URL ?? "https://evm-testnet.qore.host";

export function makeClient(): QoreChainClient {
  return createClient({
    network: "testnet",
    endpoints: { rest: REST_URL, evmRpc: EVM_RPC },
  });
}

/** CW20 increase_allowance JSON for the Native ledger leg. */
export function allowancePayload(
  spender: string,
  amount: string | bigint,
): { increase_allowance: { spender: string; amount: string } } {
  return {
    increase_allowance: {
      spender,
      amount: typeof amount === "bigint" ? amount.toString() : amount,
    },
  };
}

/** ABI calldata for executeCrossVMCall on the bridge precompile. */
export function encodeBridgeCalldata(
  nativeTarget: string,
  executeMsg: object,
): `0x${string}` {
  const payload = new TextEncoder().encode(JSON.stringify(executeMsg));
  let hex = "0x";
  for (const b of payload) hex += b.toString(16).padStart(2, "0");
  return encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "executeCrossVMCall",
        stateMutability: "nonpayable",
        inputs: [
          { name: "targetVM", type: "uint8" },
          { name: "targetContract", type: "string" },
          { name: "payload", type: "bytes" },
        ],
        outputs: [{ name: "result", type: "bytes" }],
      },
    ] as const,
    functionName: "executeCrossVMCall",
    args: [1, nativeTarget, hex as `0x${string}`],
  });
}

export async function fetchAllowlist(
  client: QoreChainClient,
): Promise<string[]> {
  try {
    const params = await getCrossVmParams(client.rest);
    const raw =
      (params as { bridge_allowed_targets?: string[] }).bridge_allowed_targets ??
      (params as { bridgeAllowedTargets?: string[] }).bridgeAllowedTargets ??
      [];
    const cleaned = raw
      .map((t) => t.replace(/^cosmwasm:/, ""))
      .filter(Boolean);
    return cleaned.length ? cleaned : [...FALLBACK_ALLOWLIST];
  } catch {
    return [...FALLBACK_ALLOWLIST];
  }
}

/**
 * SDK message path: MsgCrossVMCall from a hybrid-signed Native account.
 * Requires a connected TxClient with pqcKeypair (not available in demo mode).
 */
export async function buildSdkAtomicDemo(tx: Parameters<typeof createCrossVMClient>[0]) {
  const xvm = createCrossVMClient(tx);
  const msg = xvm.buildCall({
    targetVm: "cosmwasm",
    targetContract: WDT_CW20,
    cosmwasm: allowancePayload(
      "qor1demo000000000000000000000000000000000",
      "1000000",
    ),
  });
  return msg;
}

export type DemoProposal = {
  id: number;
  description: string;
  evmRecipient: string;
  nativeBeneficiary: string;
  amountEth: string;
  yes: number;
  no: number;
  deadline: number;
  executed: boolean;
  canceled: boolean;
};

export function createDemoState(): {
  treasuryEth: number;
  members: string[];
  proposals: DemoProposal[];
  allowlist: string[];
  lastBridgeCalldata: string;
  lastNativePayload: string;
} {
  return {
    treasuryEth: 5,
    members: ["0xChair…a11ce", "0xAlice…b0b", "0xBob…c0de"],
    proposals: [],
    allowlist: [...FALLBACK_ALLOWLIST],
    lastBridgeCalldata: "",
    lastNativePayload: "",
  };
}
