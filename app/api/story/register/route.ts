
import { NextRequest } from "next/server";
import { getStoryClient, WIP_TOKEN_ADDRESS, ROYALTY_POLICY_LAP } from "@/lib/story";
import { LicenseTerms } from "@story-protocol/core-sdk";
import { createHash } from "crypto";
import { zeroAddress } from "viem";

// Helper untuk menghasilkan string tipe `0x${string}`
function to0xHexFromString(input: string): `0x${string}` {
  const h = createHash("sha256").update(input).digest("hex");
  return `0x${h}`;
}

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
  // default = commercial remix (rev share 50%)
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
    const description =
      body.description || "Created with Story SDK via Next.js server route.";
    const image = body.image || "https://picsum.photos/600/400";

    // ===== Metadata sederhana =====
    const ipMetadata = {
      title,
      description,
      image,
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

    const nftMetadata = {
      name: `${title} — Ownership NFT`,
      description,
      image,
    };

    // Hash ke bentuk `0x{hex}`
    const ipMetadataHash: `0x${string}` = to0xHexFromString(JSON.stringify(ipMetadata));
    const nftMetadataHash: `0x${string}` = to0xHexFromString(JSON.stringify(nftMetadata));

    // Pack sesuai tipe SDK
    const ipMetadataPack = {
      ipMetadataURI: "ipfs://todo",
      ipMetadataHash,
      nftMetadataURI: "ipfs://todo",
      nftMetadataHash,
    };

    // Terms (PIL)
    const terms = buildTerms(body.flavor || "commercialRemix");

    // Mode: pakai NFT existing atau mint SPG baru
    const mode: "spgMint" | "existingNft" =
      body.mode || (process.env.EXISTING_NFT_ADDRESS ? "existingNft" : "spgMint");

    if (mode === "existingNft") {
      const nftContract = (body.nftContract ||
        process.env.EXISTING_NFT_ADDRESS) as `0x${string}` | undefined;
      const tokenId = String(body.tokenId || process.env.EXISTING_NFT_TOKEN_ID || "1");

      if (!nftContract) {
        return Response.json(
          { ok: false, error: "Missing nftContract for existingNft mode." },
          { status: 400 }
        );
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
        {
          ok: true,
          mode,
          txHash: rsp.txHash,
          ipId: rsp.ipId,
          tokenId: rsp.tokenId,
          licenseTermsIds: rsp.licenseTermsIds,
        },
        { status: 200 }
      );
    }

    // spgMint
    const spgNftContract = (body.spgNftContract ||
      process.env.STORY_SPG_NFT_CONTRACT) as `0x${string}` | undefined;

    if (!spgNftContract) {
      return Response.json(
        {
          ok: false,
          error:
            "Missing spgNftContract. Buat koleksi lewat /api/story/create-collection atau set STORY_SPG_NFT_CONTRACT.",
        },
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
      {
        ok: true,
        mode: "spgMint",
        txHash: rsp.txHash,
        ipId: rsp.ipId,
        tokenId: rsp.tokenId,
        licenseTermsIds: rsp.licenseTermsIds,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
          }
