// lib/story.ts
import { http, zeroAddress } from "viem";
import { Account, privateKeyToAccount, Address } from "viem/accounts";
import {
  StoryClient,
  StoryConfig,
  LicenseTerms,
} from "@story-protocol/core-sdk";

/** ====== constants (Story Mainnet 1514) ====== */
export const WIP_TOKEN_ADDRESS =
  "0x1514000000000000000000000000000000000000"; // revenue token (mainnet)
export const ROYALTY_POLICY_LAP =
  "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E"; // RoyaltyPolicyLAP (mainnet)

/** normalize pk: allow with/without 0x */
function normalizePk(value?: string): Address {
  if (!value) throw new Error("Missing STORY_PRIVATE_KEY");
  const v = value.trim();
  return (v.startsWith("0x") ? v : `0x${v}`) as Address;
}

/** create a ready-to-use client (server-side signing) */
export function getStoryClient() {
  const pk = normalizePk(process.env.STORY_PRIVATE_KEY);
  const account: Account = privateKeyToAccount(pk);
  const rpc = process.env.STORY_RPC_URL || "https://mainnet.storyrpc.io";

  const config: StoryConfig = {
    account,
    transport: http(rpc),
    chainId: 1514, // Story mainnet
  };
  return StoryClient.newClient(config);
}

/** ====== License presets ======
 *  nonCommercial     → atribusi, no commercial
 *  commercialUse     → boleh komersial (tanpa derivatives)
 *  commercialRemix   → komersial + derivatif + 50% rev share
 */
export type LicenseFlavor =
  | "nonCommercial"
  | "commercialUse"
  | "commercialRemix";

export function buildTerms(flavor: LicenseFlavor): LicenseTerms {
  if (flavor === "nonCommercial") {
    return {
      transferable: true,
      royaltyPolicy: ROYALTY_POLICY_LAP,
      defaultMintingFee: 0n,
      expiration: 0n,
      commercialUse: false,
      commercialAttribution: true,
      commercializerChecker: zeroAddress,
      commercializerCheckerData: "0x",
      commercialRevShare: 0,
      commercialRevCeiling: 0n,
      derivativesAllowed: true,
      derivativesAttribution: true,
      derivativesApproval: false,
      derivativesReciprocal: false,
      derivativeRevCeiling: 0n,
      currency: WIP_TOKEN_ADDRESS,
      uri: "",
    };
  }
  if (flavor === "commercialUse") {
    return {
      transferable: true,
      royaltyPolicy: ROYALTY_POLICY_LAP,
      defaultMintingFee: 0n,
      expiration: 0n,
      commercialUse: true,
      commercialAttribution: true,
      commercializerChecker: zeroAddress,
      commercializerCheckerData: "0x",
      commercialRevShare: 0,
      commercialRevCeiling: 0n,
      derivativesAllowed: false,
      derivativesAttribution: false,
      derivativesApproval: false,
      derivativesReciprocal: false,
      derivativeRevCeiling: 0n,
      currency: WIP_TOKEN_ADDRESS,
      uri: "",
    };
  }
  // default: commercial remix (50% RS + derivatives)
  return {
    transferable: true,
    royaltyPolicy: ROYALTY_POLICY_LAP,
    defaultMintingFee: 0n,
    expiration: 0n,
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: "0x",
    commercialRevShare: 50,
    commercialRevCeiling: 0n,
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: 0n,
    currency: WIP_TOKEN_ADDRESS,
    uri: "",
  };
}

/** ====== helpers: create simple metadata packs (hash-only demo) ====== */
import { createHash } from "crypto";
import { toHex } from "viem";

export type SimpleIpMeta = {
  title: string;
  description?: string;
  image?: string;
};

export function makeMetadataPack(ip: SimpleIpMeta) {
  const title = ip.title;
  const description = ip.description || "Created with Story SDK via Next.js.";
  const image = ip.image || "https://picsum.photos/600/400";

  const ipMd = {
    title,
    description,
    image,
    imageHash: toHex(createHash("sha256").update(image).digest("hex")),
    mediaUrl: image,
    mediaHash: toHex(createHash("sha256").update(image).digest("hex")),
    mediaType: "image/png",
    creators: [
      {
        name: "You",
        address: "0x0000000000000000000000000000000000000000",
        description: "Creator",
        contributionPercent: 100,
        socialMedia: [],
      },
    ],
  };
  const nftMd = {
    name: `${title} — Ownership NFT`,
    description,
    image,
  };

  const ipHash = createHash("sha256")
    .update(JSON.stringify(ipMd))
    .digest("hex");
  const nftHash = createHash("sha256")
    .update(JSON.stringify(nftMd))
    .digest("hex");

  return {
    ipMetadataURI: "ipfs://todo", // optional: ganti dengan pin IPFS kalau perlu
    ipMetadataHash: `0x${ipHash}`,
    nftMetadataURI: "ipfs://todo",
    nftMetadataHash: `0x${nftHash}`,
  };
}

/** ====== actions ====== */
export async function createCollection(params?: {
  name?: string;
  symbol?: string;
}) {
  const client = getStoryClient();
  const name = params?.name || "My SPG NFTs";
  const symbol = params?.symbol || "MYIP";

  const created = await client.nftClient.createNFTCollection({
    name,
    symbol,
    isPublicMinting: false,
    mintOpen: true,
    mintFeeRecipient: zeroAddress,
    contractURI: "",
    txOptions: { waitForTransaction: true },
  });

  return created; // { spgNftContract, txHash }
}

export async function registerWithSpg(args: {
  spgNftContract: `0x${string}`;
  ip: SimpleIpMeta;
  flavor: LicenseFlavor;
}) {
  const client = getStoryClient();
  const ipMetadata = makeMetadataPack(args.ip);
  const terms = buildTerms(args.flavor);

  const rsp = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
    spgNftContract: args.spgNftContract,
    licenseTermsData: [{ terms }],
    ipMetadata,
    recipient: undefined,
    txOptions: { waitForTransaction: true },
  });

  return rsp; // { txHash, ipId, tokenId, licenseTermsIds }
}

export async function registerExistingNft(args: {
  nftContract: `0x${string}`;
  tokenId: string | number;
  ip: SimpleIpMeta;
  flavor: LicenseFlavor;
}) {
  const client = getStoryClient();
  const ipMetadata = makeMetadataPack(args.ip);
  const terms = buildTerms(args.flavor);

  const rsp = await client.ipAsset.registerIpAndAttachPilTerms({
    nftContract: args.nftContract,
    tokenId: String(args.tokenId),
    licenseTermsData: [{ terms }],
    ipMetadata,
    deadline: Date.now() + 60_000,
    txOptions: { waitForTransaction: true },
  });

  return rsp; // { txHash, ipId, tokenId, licenseTermsIds }
            }
