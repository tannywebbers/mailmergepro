import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization token" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Fetch drafts from Gmail API
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to fetch drafts" },
        { status: response.status },
      )
    }

    const data = await response.json()
    const drafts = data.drafts || []

    // Fetch detailed information for each draft
    const detailedDrafts = await Promise.all(
      drafts.slice(0, 20).map(async (draft: any) => {
        try {
          const draftResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draft.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (draftResponse.ok) {
            const draftData = await draftResponse.json()
            const message = draftData.message

            // Extract subject from headers
            const subjectHeader = message.payload?.headers?.find(
              (header: any) => header.name.toLowerCase() === "subject",
            )

            return {
              id: draft.id,
              subject: subjectHeader?.value || "No Subject",
              snippet: message.snippet || "No preview available",
            }
          }

          return {
            id: draft.id,
            subject: "No Subject",
            snippet: "Unable to load preview",
          }
        } catch (error) {
          return {
            id: draft.id,
            subject: "No Subject",
            snippet: "Error loading draft",
          }
        }
      }),
    )

    return NextResponse.json({ drafts: detailedDrafts })
  } catch (error) {
    console.error("Drafts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
