import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization token" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { draftId, to, senderName, replyTo, noReply } = await request.json()

    if (!draftId || !to) {
      return NextResponse.json({ error: "Missing draftId or recipient" }, { status: 400 })
    }

    // Fetch the draft with full format to preserve all content
    const draftResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}?format=full`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!draftResponse.ok) {
      const errorData = await draftResponse.json()
      return NextResponse.json(
        {
          error: errorData.error?.message || "Failed to fetch draft",
        },
        { status: draftResponse.status },
      )
    }

    const draftData = await draftResponse.json()
    const message = draftData.message

    // Extract email components
    const headers = message.payload?.headers || []
    const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")
    const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")

    // Function to recursively extract content from message parts
    function extractContent(payload: any): { textContent: string; htmlContent: string } {
      let textContent = ""
      let htmlContent = ""

      if (payload.body?.data) {
        const content = Buffer.from(payload.body.data, "base64").toString("utf-8")
        if (payload.mimeType === "text/plain") {
          textContent = content
        } else if (payload.mimeType === "text/html") {
          htmlContent = content
        }
      }

      if (payload.parts) {
        for (const part of payload.parts) {
          const partContent = extractContent(part)
          if (partContent.textContent) textContent = partContent.textContent
          if (partContent.htmlContent) htmlContent = partContent.htmlContent
        }
      }

      return { textContent, htmlContent }
    }

    const { textContent, htmlContent } = extractContent(message.payload)

    // Determine sender information
    let fromAddress = ""
    if (fromHeader?.value) {
      const emailMatch = fromHeader.value.match(/<(.+?)>/)
      fromAddress = emailMatch ? emailMatch[1] : fromHeader.value
    }

    const trackingId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const appUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl

    let finalHtmlContent = htmlContent
    const finalTextContent = textContent

    // If we only have plain text, convert it to HTML
    if (textContent && !htmlContent) {
      finalHtmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
    <div style="white-space: pre-wrap;">${textContent.replace(/\n/g, "<br>")}</div>
</body>
</html>`
    }

    const trackingParams = new URLSearchParams({
      id: trackingId,
      sender: fromAddress,
      recipient: to,
    })
    const trackingUrl = `${appUrl}/api/open?${trackingParams.toString()}`
    const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" />`

    if (finalHtmlContent.includes("</body>")) {
      finalHtmlContent = finalHtmlContent.replace("</body>", `${trackingPixel}</body>`)
    } else if (finalHtmlContent.includes("</html>")) {
      finalHtmlContent = finalHtmlContent.replace("</html>", `${trackingPixel}</html>`)
    } else {
      finalHtmlContent = finalHtmlContent + `<div style="font-size:0;line-height:0;opacity:0;">${trackingPixel}</div>`
    }

    console.log("[v0] Tracking pixel added to email:", trackingId)

    const emailHeaders = [
      `To: ${to}`,
      `Subject: ${subjectHeader?.value || "No Subject"}`,
      `MIME-Version: 1.0`,
      `Message-ID: <${trackingId}@${fromAddress.split("@")[1] || "gmail.com"}>`,
      `Date: ${new Date().toUTCString()}`,
      `X-Mailer: Mail Merge Pro`,
      `X-Priority: 3`,
      `Importance: Normal`,
    ]

    // Add From header with custom sender name if provided
    if (senderName && fromAddress) {
      emailHeaders.push(`From: ${senderName} <${fromAddress}>`)
    } else if (fromHeader?.value) {
      emailHeaders.push(`From: ${fromHeader.value}`)
    }

    // Add Reply-To header based on configuration
    if (noReply) {
      emailHeaders.push(`Reply-To: noreply@${fromAddress.split("@")[1] || "gmail.com"}`)
    } else if (replyTo) {
      emailHeaders.push(`Reply-To: ${replyTo}`)
    }

    let rawMessage = ""

    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    emailHeaders.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
    emailHeaders.push("")

    rawMessage = emailHeaders.join("\r\n")
    rawMessage += `\r\n--${boundary}\r\n`
    rawMessage += `Content-Type: text/plain; charset=utf-8\r\n`
    rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`
    rawMessage +=
      Buffer.from(finalTextContent || textContent || "No content", "utf-8")
        .toString("base64")
        .match(/.{1,76}/g)
        ?.join("\r\n") || ""
    rawMessage += `\r\n\r\n--${boundary}\r\n`
    rawMessage += `Content-Type: text/html; charset=utf-8\r\n`
    rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`
    rawMessage +=
      Buffer.from(finalHtmlContent, "utf-8")
        .toString("base64")
        .match(/.{1,76}/g)
        ?.join("\r\n") || ""
    rawMessage += `\r\n\r\n--${boundary}--`

    // Encode the complete message for Gmail API
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")

    // Send the email
    const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    })

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json()
      return NextResponse.json(
        {
          error: errorData.error?.message || "Failed to send email",
        },
        { status: sendResponse.status },
      )
    }

    const sendData = await sendResponse.json()
    console.log("[v0] Email sent successfully with tracking ID:", trackingId)
    return NextResponse.json({
      success: true,
      messageId: sendData.id,
      to: to,
      trackingId: trackingId,
    })
  } catch (error) {
    console.error("Send email error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
