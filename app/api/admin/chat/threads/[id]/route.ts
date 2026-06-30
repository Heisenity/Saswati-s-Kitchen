import { NextResponse } from "next/server";
import { getAdminThread } from "@/lib/chat-service";
import { AdminApiAuthError, requireStrictAdminApiSession } from "@/lib/auth";
import { rejectJson } from "@/lib/security";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireStrictAdminApiSession();
    const { id } = await context.params;
    const thread = await getAdminThread(id);

    if (!thread) {
      return rejectJson(404, "Thread not found.");
    }

    return NextResponse.json({
      ok: true,
      thread
    });
  } catch (error) {
    if (error instanceof AdminApiAuthError) {
      return rejectJson(error.status, error.message);
    }

    return rejectJson(400, "Could not load this conversation.");
  }
}
