import { HttpDiscordCrawler } from "@/lib/http-discord-crawler";
import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for Discord compatibility
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { action, resumeFromId, fileId } = await request.json();
    console.log(`Discord bot API called with action: ${action}`);

    // Handle token validation without crawler initialization
    if (action === "validate-token") {
      console.log("Validating Discord bot token...");
      if (!process.env.DISCORD_BOT_TOKEN) {
        throw new Error("DISCORD_BOT_TOKEN is required");
      }

      const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const botInfo = await response.json();
        const result = {
          message: "Token validation successful",
          botInfo: {
            username: botInfo.username,
            id: botInfo.id,
            discriminator: botInfo.discriminator,
          },
          method: "HTTP API",
        };
        console.log("Token validation completed:", result);
        return NextResponse.json(result);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Token validation failed: HTTP ${response.status}: ${
            errorData.message || "Invalid token"
          }`
        );
      }
    }

    // Initialize HTTP-based Discord crawler
    console.log("Initializing HTTP Discord crawler...");
    const httpCrawler = new HttpDiscordCrawler();

    // Validate token
    const validation = await httpCrawler.validateToken();
    if (!validation.valid) {
      throw new Error(
        `HTTP crawler initialization failed: ${validation.error}`
      );
    }
    console.log("HTTP Discord crawler initialized successfully");

    let result;

    switch (action) {
      case "crawl":
        console.log("Starting HTTP-based crawl operation...");
        result = await httpCrawler.crawlAllMessages(resumeFromId);
        result.method = "HTTP API";
        console.log("Crawl operation completed:", result);
        break;

      case "refresh":
        console.log("Starting HTTP-based URL refresh...");
        const refreshedCount = await httpCrawler.refreshExpiredUrls();
        result = {
          refreshedCount,
          message: `Refreshed ${refreshedCount} URLs`,
          method: "HTTP API",
        };
        console.log("URL refresh completed:", result);
        break;

      case "refresh-single":
        if (!fileId) {
          return NextResponse.json(
            { error: "fileId is required for refresh-single action" },
            { status: 400 }
          );
        }
        console.log(`Starting HTTP-based single file refresh for: ${fileId}`);
        const refreshed = await httpCrawler.refreshSingleFile(fileId);
        result = {
          refreshed,
          message: refreshed
            ? `Successfully refreshed URL for file ${fileId}`
            : `No refresh needed for file ${fileId}`,
          method: "HTTP API",
        };
        console.log("Single file refresh completed:", result);
        break;

      case "status":
        console.log("Getting HTTP crawler status...");
        result = httpCrawler.getProgress();
        result.method = "HTTP API";
        console.log("Status retrieved:", result);
        break;

      case "test-permissions":
        console.log("Testing bot permissions via HTTP API...");
        const httpTest = await httpCrawler.testChannelAccess();
        result = {
          botConnected: true, // Token validation passed
          channelFound: httpTest.channelFound,
          canReadMessages: httpTest.canReadMessages,
          canReadHistory: httpTest.canReadMessages, // Same for HTTP
          botInGuild: httpTest.botInGuild,
          errorDetails: httpTest.errorDetails,
          method: "HTTP API",
        };
        console.log("Permission test completed:", result);
        break;

      default:
        console.log(`Invalid action received: ${action}`);
        return NextResponse.json(
          {
            error:
              "Invalid action. Use 'crawl', 'refresh', 'refresh-single', 'status', or 'test-permissions'",
          },
          { status: 400 }
        );
    }

    console.log("Sending response:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Discord bot API error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        error: "Discord bot operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if required environment variables are set
    const requiredEnvVars = ["DISCORD_BOT_TOKEN", "DISCORD_CHANNEL_ID"];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required environment variables",
          missing: missingVars,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "Discord bot ready",
      channelId: process.env.DISCORD_CHANNEL_ID,
      hasToken: !!process.env.DISCORD_BOT_TOKEN,
    });
  } catch (error) {
    console.error("Discord bot status check error:", error);
    return NextResponse.json(
      { error: "Failed to check Discord bot status" },
      { status: 500 }
    );
  }
}
