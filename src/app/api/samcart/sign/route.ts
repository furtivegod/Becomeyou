import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.SAMCART_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Server not configured: SAMCART_WEBHOOK_SECRET missing" }, { status: 500 })
    }

    const { body } = await request.json() as { body: unknown }
    if (typeof body === "undefined") {
      return NextResponse.json({ error: "Body to sign required" }, { status: 400 })
    }

    const raw = typeof body === "string" ? body : JSON.stringify(body)
    const signature = crypto.createHmac("sha256", secret).update(raw).digest("hex")

    return NextResponse.json({ signature, raw })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
