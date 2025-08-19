import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return Response.json({
    ok: true,
    msg: "Stub register API jalan ✅ v3",
  });
}
