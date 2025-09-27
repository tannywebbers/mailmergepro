import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

interface ReadEntry {
  id: string
  recipient: string
  sender: string
  timeRead: string
}

export async function GET() {
  console.log("[v0] Read.json endpoint called")

  try {
    const readJsonPath = path.join(process.env.NODE_ENV === "production" ? "/tmp" : process.cwd(), "read.json")
    console.log("[v0] Reading from file path:", readJsonPath)

    let entries: ReadEntry[] = []

    try {
      const fileContent = await fs.readFile(readJsonPath, "utf-8")
      entries = JSON.parse(fileContent)
      console.log("[v0] Loaded entries:", entries.length)
    } catch (error) {
      // File doesn't exist, return empty array
      console.log("[v0] File doesn't exist, returning empty array")
      entries = []
    }

    // Remove entries older than 48 hours and sort by latest first
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const originalLength = entries.length
    entries = entries
      .filter((entry) => entry.timeRead > cutoffTime)
      .sort((a, b) => new Date(b.timeRead).getTime() - new Date(a.timeRead).getTime())

    console.log(
      "[v0] Returning entries after pruning:",
      entries.length,
      "total,",
      originalLength - entries.length,
      "pruned",
    )

    return NextResponse.json(entries)
  } catch (error) {
    console.error("[v0] Failed to read tracking data:", error)
    return NextResponse.json({ error: "Failed to read tracking data" }, { status: 500 })
  }
}
