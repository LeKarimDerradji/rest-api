const crypto = require("crypto");
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

const customizeError = (e) => {
  // A query error
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    e.status = "fail";
    e.dataError = {};
    switch (e.code) {
      case "P2002":
        e.dataError[e.meta.target[0]] = `${e.meta.target[0]} already exists`;
        break;
      default:
        e.dataError[e.meta.target[0]] = e.message;
    }
  } else {
    e.status = "error";
  }
  throw e;
};

exports.register = async (username, email) => {
  const apiKey = crypto.randomUUID();
  try {
    const result = await prisma.user.create({
      data: {
        username: username,
        email: email,
        apiKey: {
          create: {
            key: apiKey,
          },
        },
      },
    });

    return await prisma.user.findUnique({
      where: {
        id: result.id,
      },
      select: {
        id: true,
        apiKey: {
          select: {
            key: true,
          },
        },
      },
    });
  } catch (e) {
    customizeError(e);
    throw e;
  }
};

exports.getUserByApiKey = async (apiKey) => {
  try {
    /* 1ere alternative: la meilleure */
    const result = await prisma.user.findFirst({
      where: {
        apiKey: {
          key: {
            contains: apiKey,
          },
        },
      },
    });
    /* 2eme alternative: result est différent
    const result =  await prisma.apiKey.findUnique({
      where: {
        key: apiKey,
      },
      select: {
        user: true,
      },
    })*/
    return result;
  } catch (e) {
    customizeError(e);
    throw e;
  }
};

exports.getUserById = async (userId) => {
  try {
    const result = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return result;
  } catch (e) {
    customizeError(e);
    throw e;
  }
};

exports.getUserByUsername = async (username) => {
  try {
    const result = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    return result;
  } catch (e) {
    customizeError(e);
    throw e;
  }
};

exports.sendMessage = async (srcId, dstId, content) => {
  try {
    const message = await prisma.message.create({
      data: {
        srcId: srcId,
        dstId: dstId,
        content: content,
      },
    });
    return message;
  } catch (e) {
    console.log(e);
    customizeError(e);
    throw e;
  }
};

exports.readMessages = async (apiKey) => {
  try {
    const username = await this.getUserByApiKey(apiKey);
    console.log(username)
    const id = username.id;
    console.log(id)
    const messages = await prisma.message.findMany({
      where: {
        srcId: id,
      },
    });
    console.log(messages)
    return messages;
  } catch (e) {
    console.log(e);
    customizeError(e);
    throw e;
  }
};

exports.readThread = async (apiKey, username) => {
  try {
    const username_1 = await this.getUserByApiKey(apiKey);
    const id_1 = username_1.id;
    const id_2 = await this.getIdByUsername(username);
    const messages = await prisma.message.findMany({
      where: {
        srcId: id_1,
        dstId: id_2,
      },
    });
    return messages;
  } catch (e) {
    console.log(e);
    customizeError(e);
    throw e;
  }
}

exports.getIdByApiKey = async (apiKey) => {
  try {
    const username = await this.getUserByApiKey(apiKey);
    return username.id;
  } catch (e) {
    customizeError(e);
    throw e;
  }
};

exports.getIdByUsername = async (username) => {
  try {
    const user = await this.getUserByUsername(username);
    return user.id;
  } catch (e) {
    customizeError(e);
    throw e;
  }
};
