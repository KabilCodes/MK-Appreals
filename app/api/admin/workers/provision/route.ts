import { NextRequest, NextResponse } from "next/server";
import { provisionWorkerAuth, ProvisionWorkerParams } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProvisionWorkerParams;

    if (!body.worker_id || !body.full_name || !body.mobile || !body.operation_id) {
      return NextResponse.json(
        { error: "Missing required fields: worker_id, full_name, mobile, operation_id" },
        { status: 400 }
      );
    }

    const result = await provisionWorkerAuth(body);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message, fallbackLocally: true }, { status: 500 });
  }
}
