const express = require("express");
//require('dotenv').config() // only for local development
const { OAuth2Client, UserRefreshClient } = require("google-auth-library");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const staccClient = new OAuth2Client(
  process.env.STACC_ID,
  process.env.STACC_SECRET,
  "postmessage"
);
const cleepClient = new OAuth2Client(
  process.env.CLEEP_ID,
  process.env.CLEEP_SECRET,
  "postmessage"
);
const obsidianClient = new OAuth2Client(
  process.env.OBSIDIAN_ID,
  process.env.OBSIDIAN_SECRET,
  "https://red-formula-303406.ue.r.appspot.com/auth/obsidian/code"
);
app.post("/auth/stacc", async (req, res) => {
  //console.log(req.body);
  const { tokens } = await staccClient.getToken(req.body.code); // exchange code for tokens
  //console.log(tokens);

  res.json(tokens);
});

app.post("/auth/stacc/refresh-token", async (req, res) => {
  const user = new UserRefreshClient(
    process.env.STACC_ID,
    process.env.STACC_SECRET,
    req.body.refreshToken
  );
  const { credentials } = await user.refreshAccessToken(); // optain new tokens
  res.json(credentials);
});

app.post("/auth/cleep", async (req, res) => {
  //console.log(req.body);
  const { tokens } = await cleepClient.getToken(req.body.code); // exchange code for tokens
  //console.log(tokens);

  res.json(tokens);
});

app.post("/auth/cleep/refresh-token", async (req, res) => {
  const user = new UserRefreshClient(
    process.env.CLEEP_ID,
    process.env.CLEEP_SECRET,
    req.body.refreshToken
  );
  const { credentials } = await user.refreshAccessToken(); // optain new tokens
  res.json(credentials);
});

app.get("/auth/obsidian", async (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/drive.file"];

  // Generate a url that asks permissions for the Drive activity scope
  const authorizationUrl = obsidianClient.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",
    /** Pass in the scopes array defined above.
     * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
    scope: scopes,
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true,
    prompt: "consent",
  });
  res.redirect(301, authorizationUrl);
});

app.get("/auth/obsidian/code", async (req, res) => {
  await obsidianClient
    .getToken(req.query.code)
    .then((token) =>
      res.send(
        "<!DOCTYPE html><html lang=''><head><meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'><meta name='viewport' content='width=device-width,initial-scale=1.0'><link rel='icon' href='<%= BASE_URL %>favicon.ico'><title>obsidian drive auth</title></head><body style='font-family: monospace'><h2> Please copy the code below: </h2><br><p style='user-select: all;'>" +
          token.tokens.refresh_token +
          "</p></body></html>"
      )
    )
    .catch((err) => {
      //console.log(err);
      res.status(404).json(err);
    }); // exchange code for tokens
});

app.post("/auth/obsidian/refresh-token", async (req, res) => {
  const user = new UserRefreshClient(
    process.env.OBSIDIAN_ID,
    process.env.OBSIDIAN_SECRET,
    req.body.refreshToken
  );
  user
    .refreshAccessToken()
    .then((e) => {
      const { credentials } = e;
      res.json(credentials);
    })
    .catch((err) => {
      res.status(400).send("Bad Request");
    }); // optain new tokens
});

app.get("/", (req, res) => {
  res.redirect(301, "https://github.com/stravo1");
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
