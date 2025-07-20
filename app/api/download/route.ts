import { HttpDiscordCrawler } from "@/lib/http-discord-crawler";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for HTTP Discord API compatibility
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const url = searchParams.get("url");
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    let downloadUrl = url;

    // If fileId is provided, try to get fresh URL from database/Discord
    if (fileId) {
      try {
        const file = await prisma.uploadedFile.findUnique({
          where: { id: fileId },
        });

        if (file?.deleted) {
          return NextResponse.json(
            { error: "File has been deleted" },
            { status: 404 }
          );
        }

        if (file && !file.deleted) {
          // Check if URL might be expired (older than 6 hours)
          const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
          const urlMightBeExpired = file.updatedAt < sixHoursAgo;

          if (
            urlMightBeExpired &&
            file.discordMessageId &&
            process.env.DISCORD_BOT_TOKEN
          ) {
            console.log(
              `Attempting to refresh expired URL for file: ${file.originalName}`
            );

            try {
              const crawler = new HttpDiscordCrawler();

              // Refresh just this specific file's URL
              const refreshed = await crawler.refreshSingleFile(file.id);

              if (refreshed) {
                // Get the updated file record
                const updatedFile = await prisma.uploadedFile.findUnique({
                  where: { id: fileId },
                });
                downloadUrl = updatedFile?.discordUrl || file.discordUrl;
                console.log(
                  `Successfully refreshed URL for: ${file.originalName}`
                );
              } else {
                downloadUrl = file.discordUrl;
              }
            } catch (refreshError) {
              console.error(
                "Failed to refresh URL, using existing:",
                refreshError
              );
              downloadUrl = file.discordUrl;
            }
          } else {
            downloadUrl = file.discordUrl;
          }
        }
      } catch (dbError) {
        console.error("Database error, falling back to provided URL:", dbError);
        downloadUrl = url;
      }
    }

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "No download URL available" },
        { status: 400 }
      );
    }

    // Fetch the file from Discord
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      // If URL is expired and we have a fileId, try one more refresh
      if (response.status === 404 && fileId) {
        try {
          console.log("URL expired, attempting emergency refresh...");
          const file = await prisma.uploadedFile.findUnique({
            where: { id: fileId },
          });

          if (file?.discordMessageId && process.env.DISCORD_BOT_TOKEN) {
            const crawler = new HttpDiscordCrawler();
            const refreshed = await crawler.refreshSingleFile(file.id);

            if (refreshed) {
              const updatedFile = await prisma.uploadedFile.findUnique({
                where: { id: fileId },
              });
              if (updatedFile) {
                const retryResponse = await fetch(updatedFile.discordUrl);
                if (retryResponse.ok) {
                  const buffer = await retryResponse.arrayBuffer();
                  const contentType =
                    retryResponse.headers.get("content-type") ||
                    "application/octet-stream";

                  return new NextResponse(buffer, {
                    status: 200,
                    headers: {
                      "Content-Type": contentType,
                      "Content-Disposition": `attachment; filename="${encodeURIComponent(
                        filename
                      )}"`,
                      "Content-Length": buffer.byteLength.toString(),
                    },
                  });
                }
              }
            }
          }
        } catch (emergencyError) {
          console.error("Emergency refresh failed:", emergencyError);
        }
      }

      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    // Return the file with download headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          filename
        )}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
