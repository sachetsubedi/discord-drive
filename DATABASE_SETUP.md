# Database Setup Instructions

## Prerequisites

1. **Install MySQL** (if not already installed):

   - **Ubuntu/Debian**: `sudo apt update && sudo apt install mysql-server`
   - **macOS**: `brew install mysql`
   - **Windows**: Download from [MySQL Official Site](https://dev.mysql.com/downloads/mysql/)

2. **Start MySQL service**:
   - **Ubuntu/Debian**: `sudo systemctl start mysql`
   - **macOS**: `brew services start mysql`
   - **Windows**: Start through Services or MySQL Workbench

## Database Configuration

1. **Log into MySQL**:

   ```bash
   sudo mysql -u root -p
   ```

2. **Create database and user**:

   ```sql
   CREATE DATABASE discord_drive;
   CREATE USER 'discord_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON discord_drive.* TO 'discord_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Update .env file**:
   ```bash
   DATABASE_URL="mysql://discord_user:your_secure_password@localhost:3306/discord_drive"
   ```

## Run Migrations

After setting up the database, run the following commands:

```bash
# Generate Prisma client
pnpm dlx prisma generate

# Create and run the migration
pnpm dlx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your data
pnpm dlx prisma studio
```

## Troubleshooting

- **Connection refused**: Make sure MySQL service is running
- **Access denied**: Check username/password in DATABASE_URL
- **Database doesn't exist**: Make sure you created the database as shown above

## Alternative: Use PlanetScale or Railway

If you prefer a cloud database:

1. **PlanetScale**:

   - Sign up at [planetscale.com](https://planetscale.com)
   - Create a database and get connection string

2. **Railway**:
   - Sign up at [railway.app](https://railway.app)
   - Add MySQL service and get connection string
