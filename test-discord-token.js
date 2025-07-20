// Simple Discord token validation test
const https = require("https");

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error("DISCORD_BOT_TOKEN not set");
  process.exit(1);
}

console.log(`Testing token: ${token.substring(0, 20)}...`);

const options = {
  hostname: "discord.com",
  port: 443,
  path: "/api/v10/users/@me",
  method: "GET",
  headers: {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  },
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response:", data);
    if (res.statusCode === 200) {
      const botInfo = JSON.parse(data);
      console.log(
        `✅ Token is valid! Bot: ${botInfo.username}#${botInfo.discriminator}`
      );
    } else {
      console.log("❌ Token validation failed");
    }
  });
});

req.on("error", (error) => {
  console.error("Network error:", error);
});

req.setTimeout(10000, () => {
  console.error("Request timed out");
  req.destroy();
});

req.end();
