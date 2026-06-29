import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { address?: string; landmark?: string };
    const address = [body.address, body.landmark].filter(Boolean).join(", ");
    const result = await geocodeAddress(address);

    if (!result) {
      return NextResponse.json({ ok: false, error: "We could not find that address yet." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not check this address right now." }, { status: 400 });
  }
}
