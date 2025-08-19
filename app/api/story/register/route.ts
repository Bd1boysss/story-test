import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    msg: "Stub register API jalan ✅ v3",
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    msg: "GET endpoint jalan juga 🚀",
  });
}
