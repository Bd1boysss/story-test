// app/api/story/register/route.ts (STUB supaya build sukses dulu)
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // sementara kita stub agar build Vercel hijau
  // nanti setelah deploy sukses, kita ganti dengan versi lengkap
  const body = await req.json().catch(() => ({}));
  return Response.json({ ok: true, note: "stub register route", received: body }, { status: 200 });
}
