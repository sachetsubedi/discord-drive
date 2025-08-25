# Discord Drive - By Sachet Subedi

A modern file upload application that stores files on Discord and indexes them in a MySQL database.


## 🤖 Discord Bot Features

**Important**: Discord attachment URLs expire after some time. The bot feature helps maintain permanent access to your files.

### Why Use the Bot?

- **Permanent Access**: Discord URLs expire, but the bot can refresh them anytime
- **Bulk Operations**: Crawl entire channels to index existing files
- **Automatic Refresh**: URLs are automatically refreshed when they expire
- **Resume Support**: Large crawls can be resumed from where they left off

### Bot Setup

1. **Create Discord Bot**:

   - Go to https://discord.com/developers/applications
   - Create application → Add Bot → Copy token
   - Add `DISCORD_BOT_TOKEN` to your `.env`

2. **Invite Bot to Server**:

   - Generate invite URL with "Read Message History" permission
   - Get channel ID and add `DISCORD_CHANNEL_ID` to `.env`

3. **Admin Operations**:
   - Visit `/admin` to access bot controls
   - **Crawl**: Index all messages in the channel (handles pagination automatically)
   - **Refresh**: Update expired URLs for all files
   - **Status**: Check crawl progress and bot connectivity

### How It Works

- **Automatic Refresh**: When downloading files, URLs are checked and refreshed if expired
- **Smart Downloads**: Falls back gracefully if bot features aren't configured
- **Rate Limiting**: Respects Discord's API limits (50 requests/minute)
- **Resume Support**: Large crawls save progress and can be resumedr easy management and retrieval.

## ✨ Features

- 🎨 **Beautiful UI** with shadcn/ui components
- 📁 **Multiple file upload** with drag & drop support
- 📊 **Progress tracking** for each upload
- 🗄️ **MySQL database** integration with Prisma ORM
- 🔍 **File indexing** and search capabilities
- 📱 **Responsive design** that works on all devices
- 🎯 **File type detection** with visual indicators
- 🔗 **Discord integration** for reliable file storage
- 🔐 **Secure authentication** with JWT and HTTP-only cookies
- 🗑️ **File management** with view, download, and delete functionality
- 🤖 **Discord Bot Integration** using **HTTP API only** (firewall-friendly, no WebSocket required)
- 🔄 **Automatic URL refresh** to prevent expired links
- ⚡ **Smart download handling** with fallback mechanisms
- 📄 **Pagination & filtering** for large file collections
- 🖼️ **Optimized image loading** with quality adjustment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MySQL server
- Discord webhook URL

### Installation

1. **Clone and install dependencies**:

   ```bash
   git clone https://github.com/sachetsubedi/discord-drive
   cd discord-drive
   pnpm install
   ```

2. **Set up Discord webhook and bot**:

   **For file uploads**:

   - Create a Discord server and channel
   - Go to channel settings → Integrations → Webhooks
   - Create a new webhook and copy the URL

   **For permanent file access (optional but recommended)**:

   - Go to Discord Developer Portal: https://discord.com/developers/applications
   - Create a new application and add a bot
   - Copy the bot token
   - Invite the bot to your server with "Read Message History" permission
   - Get your channel ID (enable Developer Mode in Discord, right-click channel → Copy ID)

3. **Configure environment**:

   Create a `.env` file in the root directory:

   ```bash
   # Database
   DATABASE_URL="mysql://discord_user:your_password@localhost:3306/discord_drive"

   # Authentication
   AUTH_USERNAME=your_username
   AUTH_PASSWORD=your_secure_password
   JWT_SECRET=your_long_random_jwt_secret_key_here_make_it_very_long

   # Discord Webhook (required for uploads)
   DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
   NEXT_PUBLIC_DISCORD_WEBHOOK_URL=your_discord_webhook_url_here

   # Discord Bot (optional but recommended for permanent file access)
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   DISCORD_CHANNEL_ID=your_channel_id_here

   # Optional: For scheduled URL refresh protection
   CRON_SECRET=your_random_cron_secret_here
   ```

4. **Set up database**:

   **Option A - Manual setup (recommended)**:

   ```bash
   # Create database and user in MySQL
   mysql -u root -p
   CREATE DATABASE discord_drive;
   CREATE USER 'discord_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON discord_drive.* TO 'discord_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;

   # Run Prisma migrations
   pnpm db:setup
   ```

   **Option B - If you have an automated script**:

   ```bash
   ./setup-db.sh
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to start uploading files!

## 📖 Usage

1. **Login**: Visit the app and login with your configured credentials from `.env`
2. **Upload Files**: Drag & drop files or click to browse and select multiple files
3. **Track Progress**: Watch real-time upload progress with visual feedback
4. **View Files**: Navigate to `/files` to see all uploaded files in a gallery
5. **Manage Files**: View metadata, download, or delete files with confirmation dialogs
6. **Logout**: Use the logout button to securely end your session
7. **Database Management**: Use `pnpm db:studio` to view data in Prisma Studio

## 🔐 Authentication

- JWT-based authentication with HTTP-only cookies for security
- All routes except `/login` are protected by middleware
- Automatic redirect to login page for unauthenticated users
- Secure session management with 24-hour token expiration
- Uses axios with credentials for reliable cookie handling

## 🛠️ Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm db:setup     # Set up database (generate + migrate)
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open Prisma Studio
pnpm db:reset     # Reset database
```

## 🗂️ File Structure

```
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication API routes
│   │   ├── files/          # File management API routes
│   │   ├── download/       # Enhanced download with URL refresh
│   │   ├── discord-bot/    # Discord bot operations API
│   │   └── refresh-urls/   # Scheduled URL refresh endpoint
│   ├── admin/              # Discord bot management page
│   ├── files/              # File gallery page with pagination
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout with auth provider
│   └── page.tsx            # Main upload page
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── ImageWithLoader.tsx # Optimized image loading component
│   └── FileCardSkeleton.tsx # Loading skeleton for files
├── lib/
│   ├── auth.tsx               # Authentication context
│   ├── axios.ts               # Axios configuration
│   ├── http-discord-crawler.ts # HTTP-based Discord bot service (no WebSocket)
│   ├── prisma.ts              # Prisma client setup
│   └── utils.ts               # Utility functions
├── prisma/
│   ├── schema.prisma      # Enhanced database schema
│   └── migrations/        # Database migrations (including bot fields)
├── middleware.ts          # Route protection middleware
└── public/                # Static assets
```

## 🔧 Environment Variables

Create a single `.env` file in the root directory with all the following variables:

```bash
# Database Configuration
DATABASE_URL="mysql://discord_user:your_password@localhost:3306/discord_drive"

# Authentication
AUTH_USERNAME=your_username
AUTH_PASSWORD=your_secure_password
JWT_SECRET=your_long_random_jwt_secret_key_here_make_it_very_long

# Discord Integration
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=your_discord_webhook_url_here

# Discord Bot (Optional - for permanent file access)
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here

# Optional: For scheduled URL refresh protection
CRON_SECRET=your_random_cron_secret_here
```

**Important**:

- All environment variables should be in the single `.env` file (no need for `.env.local`)
- Replace `your_password` with the actual MySQL password you set
- Use a strong, unique password for `AUTH_PASSWORD`
- Generate a long, random string for `JWT_SECRET` (at least 32 characters)
- Get your Discord webhook URL from your Discord server settings
- **Bot features are optional** - the app works fine with just webhook URLs
- If using bot features, ensure the bot has "Read Message History" permission

## 📊 Database Schema

The application uses an enhanced schema to support Discord bot integration:

```prisma
model UploadedFile {
  id          String   @id @default(cuid())
  filename    String
  originalName String
  fileSize    BigInt
  mimeType    String?
  discordUrl  String   @unique @db.Text
  uploadedAt  DateTime @default(now())

  // Discord Bot Integration Fields
  discordMessageId     String? // For URL refresh capability
  discordAttachmentId  String? // For precise attachment matching
  updatedAt           DateTime @default(now()) @updatedAt

  @@map("UploadedFile")
}
```

**Schema Evolution**:

- Original fields support basic file storage and retrieval
- Discord bot fields enable permanent URL management
- `updatedAt` tracks when URLs were last refreshed
- Allows files to be uploaded via webhook and later indexed by bot

## 🎨 UI Components

Built with modern, accessible components:

- **Cards** for organized layouts
- **Progress bars** for upload tracking
- **Badges** for file type indicators
- **Buttons** with proper loading states
- **Alerts** for error handling

## 🔍 Troubleshooting

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database setup instructions and troubleshooting tips.

## Author
[Sachet Subedi](https://sachetsubedi001.com.np)

## 📝 License

MIT License - feel free to use this project however you'd like!
