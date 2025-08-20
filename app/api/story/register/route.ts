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

function sha256Hex(input: string): `0x${string}` {
  const hex = createHash("sha256").update(input).digest("hex");
  return (`0x${hex}`) as `0x${string}`;
}

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

    const title = body.title ?? "My First Story IP";
    const description = body.description ?? "Created with Story SDK via Next.js route.";
    const image = body.image ?? "https://picsum.photos/600/400";

    const ipMetadata = {
      title,
      description,
      image,
      imageHash: sha256Hex(image),
      mediaUrl: image,
      mediaHash: sha256Hex(image),
      mediaType: "image/png",
      creators: [
        {
          name: "You",
          address: "0x0000000000000000000000000000000000000000",
          description: "Creator",
          contributionPercent: 100,
          socialMedia: [] as string[],
        },
      ],
    };

    const nftMetadata = {
      name: `${title} — Ownership NFT`,
      description,
      image,
    };

    const ipHash = sha256Hex(JSON.stringify(ipMetadata));
    const nftHash = sha256Hex(JSON.stringify(nftMetadata));

    const ipMetadataPack = {
      ipMetadataURI: "ipfs://todo",
      ipMetadataHash: ipHash,
      nftMetadataURI: "ipfs://todo",
      nftMetadataHash: nftHash,
    };

    const flavor = body.flavor ?? "commercialRemix";
    const terms = buildTerms(flavor);

    const mode: "spgMint" | "existingNft" =
      body.mode ?? (process.env.EXISTING_NFT_ADDRESS ? "existingNft" : "spgMint");

    if (mode === "existingNft") {
      const nftContract = (body.nftContract || process.env.EXISTING_NFT_ADDRESS) as `0x${string}`;
      const tokenId = String(body.tokenId ?? process.env.EXISTING_NFT_TOKEN_ID ?? "1");
      if (!nftContract) {
        return Response.json({ ok: false, error: "Missing nftContract for existingNft mode." }, { status: 400 });
      }

      const rsp = await client.ipAsset.registerIpAndAttachPilTerms({
        nftContract,
        tokenId,
        licenseTermsData: [{ terms }],
        ipMetadata: ipMetadataPack,
        deadline: Date.now() + 60_000,
        txOptions: { waitForTransaction: true },
      });

      return Response.json(
        { ok: true, mode, txHash: rsp.txHash, ipId: rsp.ipId, tokenId: rsp.tokenId, licenseTermsIds: rsp.licenseTermsIds },
        { status: 200 }
      );
    }

    const spgNftContract = (body.spgNftContract || process.env.STORY_SPG_NFT_CONTRACT) as `0x${string}`;
    if (!spgNftContract) {
      return Response.json(
        { ok: false, error: "Missing spgNftContract. Buat via /api/story/create-collection atau set STORY_SPG_NFT_CONTRACT." },
        { status: 400 }
      );
    }

    const rsp = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract,
      licenseTermsData: [{ terms }],
      ipMetadata: ipMetadataPack,
      recipient: undefined,
      txOptions: { waitForTransaction: true },
    });

    return Response.json(
      { ok: true, mode, txHash: rsp.txHash, ipId: rsp.ipId, tokenId: rsp.tokenId, licenseTermsIds: rsp.licenseTermsIds },
      { status: 200 }
    );
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
      }
