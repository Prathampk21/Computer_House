import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Webhook endpoint is reserved for Supabase Auth/storage hooks.",
  });
}
