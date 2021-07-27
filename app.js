const crypto = require("crypto");
const express = require("express");
const { PrismaClient } = require("@prisma/client");


const IP = "172.30.53.11";
const PORT = 3333;

const prisma = new PrismaClient();
const app = express();

app.use(express.urlencoded({ extended: false })); // to support URL-encoded bodies
app.use(express.json()); // to support JSON-encoded bodies

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const api_key = crypto.randomUUID();
  try {
    const result = await prisma.user.create({
      data: {
        username: username,
        email: email,
        apiKey: {
          create: {
            key: api_key,
          },
        },
      },
    });
    console.log(result);
    res.json({ status: 200, key: api_key });
  } catch (error) {
    res.sendStatus(418);
  }
});

app.delete("/deleteUser/:id", async (req, res) => {
  const id = Number(req.params.id);
  console.log(req.params.id);
  try {
    /* const deleteApiKey = await prisma.apiKey.delete({
      where: {id: id}
    }) */
    const deletedUser = await prisma.user.delete({
      where: { id: id },
    });
    res.sendStatus(200);
  } catch (error) {
    res.send(error);
    console.log(error);
  }
});

app.post("/send/", async (req, res) => {
  const srcUser = req.body.username;
  const destUser = req.body.sendTo;
  const content = req.body.content;
  try {
    const message = await prisma.message.create({
      data: {
        src: { connect: {username: srcUser } },
        dst: { connect: {username: destUser }},
        content: content,
      },
    });
    console.log(message);
    res.json({ status: 200, message: content });
  } catch (error) {}
});


app.listen(PORT, IP, () => {
  console.log(`listening on ${IP}:${PORT}`);
});
