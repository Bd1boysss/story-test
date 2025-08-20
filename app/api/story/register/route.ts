// app/api/story/register/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getStoryClient, WIP_TOKEN_ADDRESS, ROYALTY_POLICY_LAP } from "@/lib/story";
import { LicenseTerms } from "@story-protocol/core-sdk";
import { createHash } from "crypto";
import { zeroAddress } from "viem";

type Payload = {
  title?: string;
  description?: string;
  image?: string;
  mode?: "spgMint" | "existingNft";
  spgNftContract?: `0x${string}`;
  nftContract?: `0x${string}`;
  tokenId?: string | number;
  flavor?: "nonCommercial" | "commercialUse" | "commercialRemix";
};

function buildTerms(flavor: Payload["flavor"]): LicenseTerms {
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

export async function POST(req: NextRequest) {
  try {
    const client = getStoryClient();
    const body = (await req.json()) as Payload;

    const title = body.title || "My First Story IP";
    const description = body.description || "Created with Story SDK via Next.js server route.";
    const image = body.image || "https://picsum.photos
