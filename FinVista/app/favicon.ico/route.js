import { NextResponse } from "next/server";

export async function GET(req) {
  return NextResponse.redirect(new URL("/logo-sm.png", req.url), 307);
}
