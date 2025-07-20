# Discord Drive

A modern file upload application that stores files on Discord and indexes them in a MySQL database for easy management and retrieval.

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

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MySQL server
- Discord webhook URL

### Installation

1. **Clone and install dependencies**:

   ```bash
   git clone <your-repo>
   cd discord-drive
   pnpm install
   ```

2. **Set up Discord webhook**:

   - Create a Discord server and channel
   - Go to channel settings → Integrations → Webhooks
   - Create a new webhook and copy the URL

3. **Configure environment**:

   Create a `.env` file in the root directory:

   ```bash
   # Database
   DATABASE_URL="mysql://discord_user:your_password@localhost:3306/discord_drive"

   # Authentication
   AUTH_USERNAME=your_username
   AUTH_PASSWORD=your_secure_password
   JWT_SECRET=your_long_random_jwt_secret_key_here_make_it_very_long

   # Discord Webhook
   DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
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
│   │   └── files/          # File management API routes
│   ├── files/              # File gallery page
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout with auth provider
│   └── page.tsx            # Main upload page
├── components/ui/          # shadcn/ui components
├── lib/
│   ├── auth.tsx           # Authentication context
│   ├── axios.ts           # Axios configuration
│   ├── prisma.ts          # Prisma client setup
│   └── utils.ts           # Utility functions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
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
```

**Important**:

- All environment variables should be in the single `.env` file (no need for `.env.local`)
- Replace `your_password` with the actual MySQL password you set
- Use a strong, unique password for `AUTH_PASSWORD`
- Generate a long, random string for `JWT_SECRET` (at least 32 characters)
- Get your Discord webhook URL from your Discord server settings

## 📊 Database Schema

The application uses a simple but effective schema:

```prisma
model UploadedFile {
  id          String   @id @default(cuid())
  filename    String
  originalName String
  fileSize    BigInt
  mimeType    String?
  discordUrl  String   @unique @db.Text
  uploadedAt  DateTime @default(now())

  @@map("UploadedFile")
}
```

## 🎨 UI Components

Built with modern, accessible components:

- **Cards** for organized layouts
- **Progress bars** for upload tracking
- **Badges** for file type indicators
- **Buttons** with proper loading states
- **Alerts** for error handling

## 🔍 Troubleshooting

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database setup instructions and troubleshooting tips.

## 📝 License

MIT License - feel free to use this project however you'd like!
