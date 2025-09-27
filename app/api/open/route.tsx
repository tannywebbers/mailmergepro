import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

// 1x1 transparent GIF as base64
const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")

interface ReadEntry {
  id: string
  recipient: string
  sender: string
  timeRead: string
}

export async function GET(request: NextRequest) {
  console.log("[v0] Tracking pixel requested")

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const sender = searchParams.get("sender")
    const recipient = searchParams.get("recipient")

    console.log("[v0] Tracking parameters:", { id, sender, recipient })

    // Always return the tracking pixel first with proper headers
    const response = new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": TRANSPARENT_GIF.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })

    // Log the email open in the background (don't await to avoid blocking the pixel response)
    if (id && sender && recipient) {
      console.log("[v0] Logging email open...")
      logEmailOpen(id, sender, recipient).catch((error) => {
        console.error("[v0] Failed to log email open:", error)
      })
    } else {
      console.log("[v0] Missing required parameters for logging")
    }

    return response
  } catch (error) {
    console.error("[v0] Tracking pixel error:", error)
    // Still return the pixel even if logging fails
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": TRANSPARENT_GIF.length.toString(),
      },
    })
  }
}

async function logEmailOpen(id: string, sender: string, recipient: string) {
  try {
    const readJsonPath = path.join(process.env.NODE_ENV === "production" ? "/tmp" : process.cwd(), "read.json")
    console.log("[v0] Using file path:", readJsonPath)

    let entries: ReadEntry[] = []

    // Read existing entries or create empty array
    try {
      const fileContent = await fs.readFile(readJsonPath, "utf-8")
      entries = JSON.parse(fileContent)
      console.log("[v0] Loaded existing entries:", entries.length)
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
      console.log("[v0] Creating new read.json file")
      entries = []
    }

    // Add new entry
    const newEntry: ReadEntry = {
      id,
      recipient,
      sender,
      timeRead: new Date().toISOString(),
    }

    entries.push(newEntry)
    console.log("[v0] Added new entry:", newEntry)

    // Remove entries older than 48 hours
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const originalLength = entries.length
    entries = entries.filter((entry) => entry.timeRead > cutoffTime)
    console.log("[v0] Pruned entries:", originalLength - entries.length, "removed")

    // Sort by timeRead (latest first)
    entries.sort((a, b) => new Date(b.timeRead).getTime() - new Date(a.timeRead).getTime())

    // Write back to file
    await fs.writeFile(readJsonPath, JSON.stringify(entries, null, 2), "utf-8")
    console.log("[v0] Successfully wrote to file")

    console.log(`[v0] Email open logged: ${recipient} opened email from ${sender} at ${newEntry.timeRead}`)
  } catch (error) {
    console.error("[v0] Failed to log email open:", error)
    // throw error
  }
}
