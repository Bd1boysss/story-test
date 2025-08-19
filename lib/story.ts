import { http } from "viem";
import { Account, privateKeyToAccount, Address } from "viem/accounts";
import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";

function normalizePk(value?: string): Address {
  if (!value) throw new Error("Missing STORY_PRIVATE_KEY");
  const trimmed = value.trim();
  return (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as Address;
}

export const WIP_TOKEN_ADDRESS = "0x1514000000000000000000000000000000000000";
export const ROYALTY_POLICY_LAP = "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E";

export function getStoryClient() {
  const pk = normalizePk(process.env.STORY_PRIVATE_KEY);
  const account: Account = privateKeyToAccount(pk);
  const rpc = process.env.STORY_RPC_URL || "https://mainnet.storyrpc.io";

  const config: StoryConfig = {
    account,
    transport: http(rpc),
    chainId: 1514,
  };
  return StoryClient.newClient(config);
}
