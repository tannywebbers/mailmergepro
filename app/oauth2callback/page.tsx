"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function OAuth2Callback() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("OAuth error:", error)
      window.location.href = "/"
      return
    }

    if (code) {
      // Exchange code for access token
      exchangeCodeForToken(code)
    }
  }, [searchParams])

  const exchangeCodeForToken = async (code: string) => {
    try {
      const response = await fetch("/api/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (data.access_token) {
        // Store tokens in localStorage
        localStorage.setItem("gmail_access_token", data.access_token)
        if (data.refresh_token) {
          localStorage.setItem("gmail_refresh_token", data.refresh_token)
        }

        // Redirect to dashboard
        window.location.href = "/"
      } else {
        throw new Error("No access token received")
      }
    } catch (error) {
      console.error("Token exchange error:", error)
      window.location.href = "/"
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
