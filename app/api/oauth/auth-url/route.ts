import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.OAUTH_REDIRECT_URI || `${request.nextUrl.origin}/oauth2callback`

    if (!clientId) {
      return NextResponse.json({ error: "OAuth configuration missing" }, { status: 500 })
    }

    const scope = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Auth URL generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
