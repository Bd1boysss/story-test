import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return Response.json(
    { ok: true, note: "stub register route", received: body },
    { status: 200 }
  );
}
