import { prisma } from "./prisma";

interface HttpDiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  attachments: Array<{
    id: string;
    filename: string;
    size: number;
    url: string;
    content_type?: string;
  }>;
}

interface HttpCrawlerProgress {
  lastMessageId?: string;
  totalMessages: number;
  totalAttachments: number;
  isComplete: boolean;
  method?: string;
}

class HttpDiscordCrawler {
  private token: string;
  private channelId: string;
  private progress: HttpCrawlerProgress = {
    totalMessages: 0,
    totalAttachments: 0,
    isComplete: false,
  };

  constructor() {
    this.token = process.env.DISCORD_BOT_TOKEN || "";
    this.channelId = process.env.DISCORD_CHANNEL_ID || "";
  }

  async validateToken(): Promise<{
    valid: boolean;
    botInfo?: any;
    error?: string;
  }> {
    try {
      const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          Authorization: `Bot ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const botInfo = await response.json();
        return { valid: true, botInfo };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          error: `HTTP ${response.status}: ${
            errorData.message || "Invalid token"
          }`,
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  async testChannelAccess(): Promise<{
    channelFound: boolean;
    canReadMessages: boolean;
    botInGuild: boolean;
    errorDetails?: string;
  }> {
    try {
      // Test channel access
      const channelResponse = await fetch(
        `https://discord.com/api/v10/channels/${this.channelId}`,
        {
          headers: {
            Authorization: `Bot ${this.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!channelResponse.ok) {
        const errorData = await channelResponse.json().catch(() => ({}));
        return {
          channelFound: false,
          canReadMessages: false,
          botInGuild: false,
          errorDetails: `Cannot access channel: HTTP ${
            channelResponse.status
          }: ${errorData.message || "Unknown error"}`,
        };
      }

      const channelData = await channelResponse.json();
      console.log(`Channel found: ${channelData.name} (${channelData.id})`);

      // Test message reading
      const messagesResponse = await fetch(
        `https://discord.com/api/v10/channels/${this.channelId}/messages?limit=1`,
        {
          headers: {
            Authorization: `Bot ${this.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!messagesResponse.ok) {
        const errorData = await messagesResponse.json().catch(() => ({}));
        return {
          channelFound: true,
          canReadMessages: false,
          botInGuild: true,
          errorDetails: `Cannot read messages: HTTP ${
            messagesResponse.status
          }: ${errorData.message || "Permission denied"}`,
        };
      }

      console.log("Successfully tested message reading via HTTP API");
      return {
        channelFound: true,
        canReadMessages: true,
        botInGuild: true,
      };
    } catch (error) {
      return {
        channelFound: false,
        canReadMessages: false,
        botInGuild: false,
        errorDetails: `HTTP API test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  async crawlAllMessages(resumeFromId?: string): Promise<HttpCrawlerProgress> {
    try {
      console.log(`Starting HTTP-based crawl for channel: ${this.channelId}`);

      let lastMessageId = resumeFromId || this.progress.lastMessageId;
      let batchCount = 0;

      while (true) {
        try {
          console.log(
            `Fetching messages batch ${batchCount + 1} via HTTP API...`
          );

          // Build URL with pagination
          let url = `https://discord.com/api/v10/channels/${this.channelId}/messages?limit=100`;
          if (lastMessageId) {
            url += `&before=${lastMessageId}`;
          }

          const response = await fetch(url, {
            headers: {
              Authorization: `Bot ${this.token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              `HTTP ${response.status}: ${
                errorData.message || "API request failed"
              }`
            );
          }

          const messages: HttpDiscordMessage[] = await response.json();

          if (messages.length === 0) {
            console.log("No more messages to fetch");
            this.progress.isComplete = true;
            break;
          }

          console.log(
            `Processing batch ${++batchCount}, found ${
              messages.length
            } messages`
          );

          // Process messages in this batch
          for (const message of messages) {
            await this.processHttpMessage(message);
            this.progress.totalMessages++;
          }

          // Update last message ID for next pagination
          lastMessageId = messages[messages.length - 1]?.id;
          this.progress.lastMessageId = lastMessageId;

          console.log(
            `Batch ${batchCount} complete. Total messages: ${this.progress.totalMessages}, Total attachments: ${this.progress.totalAttachments}`
          );

          // Rate limiting - Discord allows 50 requests per minute
          await new Promise((resolve) => setTimeout(resolve, 1200));
        } catch (error) {
          console.error("Error in batch processing:", error);
          // Continue with next batch on error
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      console.log(
        `HTTP Crawl complete! Processed ${this.progress.totalMessages} messages, ${this.progress.totalAttachments} attachments`
      );
      return this.progress;
    } catch (error) {
      console.error("Error in HTTP crawling:", error);
      throw error;
    }
  }

  private async processHttpMessage(message: HttpDiscordMessage): Promise<void> {
    try {
      if (message.attachments.length === 0) return;

      for (const attachment of message.attachments) {
        await this.processHttpAttachment(attachment, message);
        this.progress.totalAttachments++;
      }
    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);
    }
  }

  private async processHttpAttachment(
    attachment: any,
    message: HttpDiscordMessage
  ): Promise<void> {
    try {
      // Check if file already exists in database
      const existingFile = await prisma.uploadedFile.findFirst({
        where: {
          OR: [
            { filename: attachment.filename || "" },
            { discordUrl: attachment.url },
          ],
        },
      });

      if (existingFile) {
        // Update the Discord URL if it's different (URL refresh)
        if (existingFile.discordUrl !== attachment.url) {
          await prisma.uploadedFile.update({
            where: { id: existingFile.id },
            data: {
              discordUrl: attachment.url,
              updatedAt: new Date(),
            },
          });
          console.log(`Updated URL for existing file: ${attachment.filename}`);
        }
        return;
      }

      // Create new file record
      await prisma.uploadedFile.create({
        data: {
          filename: attachment.filename || `attachment_${attachment.id}`,
          originalName: attachment.filename || `attachment_${attachment.id}`,
          fileSize: BigInt(attachment.size),
          mimeType: attachment.content_type,
          discordUrl: attachment.url,
          discordMessageId: message.id,
          discordAttachmentId: attachment.id,
          uploadedAt: new Date(message.timestamp),
        },
      });

      console.log(
        `Added new file: ${attachment.filename} (${this.formatFileSize(
          attachment.size
        )})`
      );
    } catch (error) {
      console.error(`Error processing attachment ${attachment.id}:`, error);
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  getProgress(): HttpCrawlerProgress {
    return this.progress;
  }

  async refreshExpiredUrls(): Promise<number> {
    try {
      console.log("Starting HTTP-based URL refresh...");

      // Find files that might have expired URLs (older than 6 hours)
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const filesToRefresh = await prisma.uploadedFile.findMany({
        where: {
          updatedAt: {
            lt: sixHoursAgo,
          },
          discordMessageId: {
            not: null,
          },
        },
      });

      console.log(
        `Found ${filesToRefresh.length} files that may need URL refresh`
      );

      let refreshedCount = 0;

      for (const file of filesToRefresh) {
        try {
          if (!file.discordMessageId) continue;

          // Fetch the message via HTTP API to get fresh attachment URLs
          const response = await fetch(
            `https://discord.com/api/v10/channels/${this.channelId}/messages/${file.discordMessageId}`,
            {
              headers: {
                Authorization: `Bot ${this.token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            console.log(
              `Could not fetch message ${file.discordMessageId}: HTTP ${response.status}`
            );
            continue;
          }

          const messageData = await response.json();
          const attachment = messageData.attachments?.find(
            (att: any) =>
              att.id === file.discordAttachmentId ||
              att.filename === file.filename ||
              att.filename === file.originalName
          );

          if (attachment && attachment.url !== file.discordUrl) {
            await prisma.uploadedFile.update({
              where: { id: file.id },
              data: {
                discordUrl: attachment.url,
                updatedAt: new Date(),
              },
            });
            refreshedCount++;
            console.log(`Refreshed URL for: ${file.originalName}`);
          }

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1200));
        } catch (error) {
          console.error(`Error refreshing URL for file ${file.id}:`, error);
        }
      }

      console.log(
        `HTTP URL refresh complete! Refreshed ${refreshedCount} URLs`
      );
      return refreshedCount;
    } catch (error) {
      console.error("Error in HTTP URL refresh:", error);
      throw error;
    }
  }

  async refreshSingleFile(fileId: string): Promise<boolean> {
    try {
      console.log(`Starting HTTP-based single file refresh for: ${fileId}`);

      const file = await prisma.uploadedFile.findUnique({
        where: { id: fileId },
      });

      if (!file || !file.discordMessageId) {
        console.log(`File ${fileId} not found or missing Discord message ID`);
        return false;
      }

      const response = await fetch(
        `https://discord.com/api/v10/channels/${this.channelId}/messages/${file.discordMessageId}`,
        {
          headers: {
            Authorization: `Bot ${this.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.log(
          `Could not fetch message ${file.discordMessageId}: HTTP ${response.status}`
        );
        return false;
      }

      const messageData = await response.json();
      const attachment = messageData.attachments?.find(
        (att: any) =>
          att.id === file.discordAttachmentId ||
          att.filename === file.filename ||
          att.filename === file.originalName
      );

      if (attachment && attachment.url !== file.discordUrl) {
        await prisma.uploadedFile.update({
          where: { id: fileId },
          data: {
            discordUrl: attachment.url,
            updatedAt: new Date(),
          },
        });
        console.log(`Refreshed URL for: ${file.originalName}`);
        return true;
      }

      console.log(`No URL refresh needed for: ${file.originalName}`);
      return false;
    } catch (error) {
      console.error(`Error refreshing single file ${fileId}:`, error);
      return false;
    }
  }
}

export { HttpDiscordCrawler, type HttpCrawlerProgress };
