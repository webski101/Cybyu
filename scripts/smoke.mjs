import assert from "node:assert/strict";
import { encodeFunctionData } from "viem";

const CROSSVM = "0x0000000000000000000000000000000000000901";
const WDT =
  "qor14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s93uuqt";

const payload = new TextEncoder().encode(
  JSON.stringify({
    increase_allowance: { spender: "qor1demo", amount: "1000" },
  }),
);
let hex = "0x";
for (const b of payload) hex += b.toString(16).padStart(2, "0");

const data = encodeFunctionData({
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
  ],
  functionName: "executeCrossVMCall",
  args: [1, WDT, hex],
});

assert.equal(data.slice(0, 10), "0x3c11078c", "selector must match docs");
assert.ok(data.length > 20);
assert.equal(CROSSVM.length, 42);
console.log("smoke ok", { selector: data.slice(0, 10), bytes: (data.length - 2) / 2 });
