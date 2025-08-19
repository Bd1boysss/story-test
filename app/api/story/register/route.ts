import { NextRequest } from "next/server";
import { getStoryClient, WIP_TOKEN_ADDRESS, ROYALTY_POLICY_LAP } from "@/lib/story";
import { LicenseTerms } from "@story-protocol/core-sdk";
import { createHash } from "crypto";
import { toHex, zeroAddress } from "viem";

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
      transferable: true, royaltyPolicy: ROYALTY_POLICY_LAP, defaultMintingFee: 0n, expiration: 0n,
      commercialUse: false, commercialAttribution: true, commercializerChecker: zeroAddress,
      commercializerCheckerData: "0x", commercialRevShare: 0, commercialRevCeiling: 0n,
      derivativesAllowed: true, derivativesAttribution: true, derivativesApproval: false, derivativesReciprocal: false,
      derivativeRevCeiling: 0n, currency: WIP_TOKEN_ADDRESS, uri: "",
    };
  }
  if (flavor === "commercialUse") {
    return {
      transferable: true, royaltyPolicy: ROYALTY_POLICY_LAP, defaultMintingFee: 0n, expiration: 0n,
      commercialUse: true, commercialAttribution: true, commercializerChecker: zeroAddress,
      commercializerCheckerData: "0x", commercialRevShare: 0, commercialRevCeiling: 0n,
      derivativesAllowed: false, derivativesAttribution: false, derivativesApproval: false, derivativesReciprocal: false,
      derivativeRevCeiling: 0n, currency: WIP_TOKEN_ADDRESS, uri: "",
    };
  }
  return {
    transferable: true, royaltyPolicy: ROYALTY_POLICY_LAP, defaultMintingFee: 0n, expiration: 0n,
    commercialUse: true, commercialAttribution: true, commercializerChecker: zeroAddress,
    commercializerCheckerData: "0x", commercialRevShare: 50, commercialRevCeiling: 0n,
    derivativesAllowed: true, derivativesAttribution: true, derivativesApproval: false, derivativesReciprocal: true,
    derivativeRevCeiling: 0n, currency: WIP_TOKEN_ADDRESS, uri: "",
  };
}

export async function POST(req: NextRequest) {
  try {
    const client = getStoryClient();
    const body = (await req.json()) as Payload;
    const title = body.title || "My First Story IP";
    const description = body.description || "Created with Story SDK";
    const image = body.image || "https://picsum.photos/600/400";

    const ipMetadata = {
      title, description, image,
      imageHash: toHex(createHash("sha256").update(image).digest("hex")),
      mediaUrl: image,
      mediaHash: toHex(createHash("sha256").update(image).digest("hex")),
      mediaType: "image/png",
      creators: [{ name: "You", address: "0x0000000000000000000000000000000000000000", description: "Creator", contributionPercent: 100, socialMedia: [] }],
    };
    const nftMetadata = { name: `${title} — Ownership NFT`, description, image };

    const ipHash = createHash("sha256").update(JSON.stringify(ipMetadata)).digest("hex");
    const nftHash = createHash("sha256").update(JSON.stringify(nftMetadata)).digest("hex");
    const ipMetadataPack = {
      ipMetadataURI: "ipfs://todo",
      ipMetadataHash: `0x${ipHash}`,
      nftMetadataURI: "ipfs://todo",
      nftMetadataHash: `0x${nftHash}`,
    };

    const terms = buildTerms(body.flavor || "commercialRemix");
    const mode = body.mode || (process.env.EXISTING_NFT_ADDRESS ? "existingNft" : "spgMint");

    if (mode === "existingNft") {
      const nftContract = (body.nftContract || process.env.EXISTING_NFT_ADDRESS) as `0x${string}`;
      const tokenId = String(body.tokenId || process.env.EXISTING_NFT_TOKEN_ID || "1");
      if (!nftContract) return Response.json({ ok: false, error: "Missing nftContract" }, { status: 400 });

      const rsp = await client.ipAsset.registerIpAndAttachPilTerms({
        nftContract, tokenId, licenseTermsData: [{ terms }], ipMetadata: ipMetadataPack,
        deadline: Date.now() + 60_000, txOptions: { waitForTransaction: true },
      });
      return Response.json({ ok: true, mode, txHash: rsp.txHash, ipId: rsp.ipId, tokenId: rsp.tokenId, licenseTermsIds: rsp.licenseTermsIds });
    } else {
      const spgNftContract = (body.spgNftContract || process.env.STORY_SPG_NFT_CONTRACT) as `0x${string}`;
      if (!spgNftContract) return Response.json({ ok: false, error: "Missing spgNftContract" }, { status: 400 });

      const rsp = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract, licenseTermsData: [{ terms }], ipMetadata: ipMetadataPack,
        recipient: undefined, txOptions: { waitForTransaction: true },
      });
      return Response.json({ ok: true, mode, txHash: rsp.txHash, ipId: rsp.ipId, tokenId: rsp.tokenId, licenseTermsIds: rsp.licenseTermsIds });
    }
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
                            }
