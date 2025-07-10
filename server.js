const express = require("express");
const { OAuth2Client, UserRefreshClient } = require("google-auth-library");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const obsidianClient = new OAuth2Client(
  process.env.OBSIDIAN_ID,
  process.env.OBSIDIAN_SECRET,
  process.env.OBSIDIAN_REDIRECT_URI || "https://ogds-compat.vercel.app/auth/obsidian/code"
);

app.get("/auth/obsidian", async (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/drive.file"];
  const authorizationUrl = obsidianClient.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    include_granted_scopes: true,
    prompt: "consent",
  });
  res.redirect(301, authorizationUrl);
});

app.get("/auth/obsidian/code", async (req, res) => {
  try {
    const { tokens } = await obsidianClient.getToken(req.query.code);
    res.send(
      `<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'><meta name='viewport' content='width=device-width,initial-scale=1.0'><link rel='icon' href='/favicon.ico'><title>Obsidian Drive Auth</title></head><body style='font-family: monospace'><h2>Please copy the code below:</h2><br><p style='user-select: all;'>${tokens.refresh_token}</p></body></html>`
    );
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/auth/obsidian/refresh-token", async (req, res) => {
  try {
    const user = new UserRefreshClient(
      process.env.OBSIDIAN_ID,
      process.env.OBSIDIAN_SECRET,
      req.body.refreshToken
    );
    const { credentials } = await user.refreshAccessToken();
    res.json(credentials);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.redirect(301, "https://github.com/stravo1");
});

module.exports = app;
