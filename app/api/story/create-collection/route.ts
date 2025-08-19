import { NextRequest } from "next/server";
import { getStoryClient } from "@/lib/story";
import { zeroAddress } from "viem";

export async function POST(req: NextRequest) {
  try {
    const client = getStoryClient();
    const body = await req.json().catch(() => ({}));
    const name = (body?.name || "My SPG NFTs") as string;
    const symbol = (body?.symbol || "MYIP") as string;

    const created = await client.nftClient.createNFTCollection({
      name,
      symbol,
      isPublicMinting: false,
      mintOpen: true,
      mintFeeRecipient: zeroAddress,
      contractURI: "",
      txOptions: { waitForTransaction: true },
    });

    return Response.json(
      { ok: true, spgNftContract: created.spgNftContract, txHash: created.txHash },
      { status: 200 }
    );
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
