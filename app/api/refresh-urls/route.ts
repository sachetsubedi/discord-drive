import { HttpDiscordCrawler } from "@/lib/http-discord-crawler";
import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for HTTP Discord API compatibility
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key protection for scheduled tasks
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting scheduled URL refresh...");

    const crawler = new HttpDiscordCrawler();

    const refreshedCount = await crawler.refreshExpiredUrls();

    console.log(`Scheduled refresh complete: ${refreshedCount} URLs refreshed`);

    return NextResponse.json({
      success: true,
      refreshedCount,
      message: `Successfully refreshed ${refreshedCount} expired URLs`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scheduled refresh error:", error);
    return NextResponse.json(
      {
        error: "Scheduled refresh failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
