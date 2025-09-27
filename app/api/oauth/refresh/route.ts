import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json()

    if (!refresh_token) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 400 })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "OAuth configuration missing" }, { status: 500 })
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token,
        grant_type: "refresh_token",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error }, { status: 400 })
    }

    return NextResponse.json(tokenData)
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
