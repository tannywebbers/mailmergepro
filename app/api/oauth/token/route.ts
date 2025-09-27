import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.OAUTH_REDIRECT_URI || `${request.nextUrl.origin}/oauth2callback`

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
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error }, { status: 400 })
    }

    return NextResponse.json(tokenData)
  } catch (error) {
    console.error("Token exchange error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
