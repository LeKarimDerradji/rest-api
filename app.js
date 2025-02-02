const crypto = require("crypto");
const express = require("express");
const db = require("./mydb");
const { PrismaClient } = require("@prisma/client");

const IP = "172.25.30.22";
const PORT = 3333;

const prisma = new PrismaClient();
const app = express();

app.use(express.urlencoded({ extended: false })); // to support URL-encoded bodies
app.use(express.json()); // to support JSON-encoded bodies

// A middle for checking if an api key is provided by the user
// If an api key is provided in the authorization header field then
// the api key is attached to the req object
const getApiKey = async (req, res, next) => {
  const apiKey = req.headers.authorization;
  if (!apiKey) {
    res.status(403).json({
      status: "fail",
      data: { apiKey: "No api key in Authorization header" },
    });
  } else {
    req.apiKey = apiKey.replace("Bearer ", "").trim();
    next();
  }
};

// A middleware for checking if an api key is valid
// and is still active.
// if Ok the id of the user performing the request is attached to the req object.

const validateApiKey = async (req, res, next) => {
  try {
    const result = await db.getUserByApiKey(req.apiKey);
    // Check if user is active
    // check if null result then not found
    if (!result || !result.active) {
      res
        .status(403)
        .json({ status: "fail", data: { key: "Invalid api key" } });
    } else {
      req.userId = result.id;
      next();
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ code: "error", message: "Internal server error" });
  }
};

app.use(express.urlencoded({ extended: false })); // to support URL-encoded bodies
app.use(express.json()); // to support JSON-encoded bodies

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  try {
    const result = await db.register(username, email);
    res.json({
      status: "success",
      data: { id: result.id, key: result.apiKey.key },
    });
  } catch (e) {
    if (e.status === "fail") {
      res.status(400).json({ status: e.status, data: e.dataError });
    } else {
      // e.status === 50X
      res.status(500).json({ status: e.status, message: e.message });
    }
  }
});

app.use(getApiKey);
app.use(validateApiKey);

app.get("/user_by_id/:userId", async (req, res) => {
  let userId = req.params.userId;
  if (isNaN(userId)) {
    res.json({ status: "fail", data: { userId: `${userId} is not a number` } });
    return;
  }
  userId = Number(userId);
  try {
    const result = await db.getUserById(userId);
    res.json({ status: "success", data: { user: result } });
  } catch (e) {
    if (e.status === "fail") {
      res.status(400).json({ status: e.status, data: e.dataError });
    } else {
      // e.status === 50X
      res.status(500).json({ status: e.status, message: e.message });
    }
  }
});

app.get("/myinfo", async (req, res) => {
  const userId = req.userId;
  try {
    const result = await db.getUserById(userId);
    res.json({ status: "success", data: { user: result } });
  } catch (e) {
    if (e.status === "fail") {
      res.status(400).json({ status: e.status, data: e.dataError });
    } else {
      // e.status === 50X
      res.status(500).json({ status: e.status, message: e.message });
    }
  }
});

app.get("/user_by_username/:username", async (req, res) => {
  try {
    console.log(req)
    const result = await db.getUserByUsername(req.params.username);
    res.json({ status: "success", data: { user: result } });
  } catch (e) {
    if (e.status === "fail") {
      res.status(400).json({ status: e.status, data: e.dataError });
    } else {
      // e.status === 50X
      res.status(500).json({ status: e.status, message: e.message });
    }
  }
});

app.post("/send_message/:username", async (req, res) => {
  try {
    const srcId = await db.getIdByApiKey(req.apiKey);
    const dstId = await db.getIdByUsername(req.params.username);
    const content = await req.body.content;
    const message = await db.sendMessage(srcId, dstId, content);
    res.json({
      status: "success",
      data: { message: message, src: srcId, dst: dstId, content: content },
    });
  } catch (e) {
    if (e.status === "fail") {
      res.status(400).json({ status: e.status, data: e.dataError });
    } else {
      // e.status === 50X
      res.status(500).json({ status: e.status, message: e.message });
    }
  }
});
// AND logic to implement
app.get("/read_message/", async (req, res) => {
  try {
    const messages = await db.readMessages(req.apiKey);
    console.log(messages);
    res.json({ status: "success", data: { messages: messages } });
  } catch (e) {
    if (e.status === "fail") {
      res.status(400).json({ status: e.status, data: e.dataError });
    } else {
      // e.status === 50X
      res.status(500).json({ status: e.status, message: e.message });
    }
  }
});
// AND logic to implement
app.get("/read_thread/:username", async (req, res) => {
  try {
    const messages = await db.readThread(req.apiKey, req.params.username);
    res.json({ status: "success", data: { messages: messages } });
  } catch (e) {
    if (e.status === "fail") {
      res.status(400).json({ status: e.status, data: e.dataError });
    } else {
      // e.status === 50X
      res.status(500).json({ status: e.status, message: e.message });
    }
  }
});

app.listen(PORT, IP, () => {
  console.log(`listening on ${IP}:${PORT}`);
});
