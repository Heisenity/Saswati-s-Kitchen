import { NextResponse } from "next/server";
import { getAdminThreads } from "@/lib/chat-service";
import { AdminApiAuthError, requireStrictAdminApiSession } from "@/lib/auth";
import { rejectJson } from "@/lib/security";

export async function GET() {
  try {
    await requireStrictAdminApiSession();
    const threads = await getAdminThreads();

    return NextResponse.json({
      ok: true,
      threads
    });
  } catch (error) {
    if (error instanceof AdminApiAuthError) {
      return rejectJson(error.status, error.message);
    }

    return rejectJson(400, "Could not load chat threads.");
  }
}
