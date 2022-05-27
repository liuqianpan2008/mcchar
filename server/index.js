const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;
// 创建 websocket 服务器 监听在 3000 端口
const wss = new WebSocketServer({ port: 3000 }, () => {
  console.log("服务器启动成功!");
});
const seedMessage = {
  tape: "",
  date: null,
  mag: "",
};

wss.on("connection", (ws) => {
  let bot = null;
  //通信成功！
  seedMessage.tape = "connection";
  seedMessage.mag = "连接成功！";
  ws.send(JSON.stringify(seedMessage));
  console.log("通信成功");
  ws.on("close", function close() {
    if (bot) {
      console.log("客户离开,玩家下线！");
      bot.quit();
    }
  });
  //监听通信
  ws.on("message", (message) => {
    console.log("客户端信息：" + message);
    var res = JSON.parse(message);
    const mineflayer = require("mineflayer");
    const mineflayerViewer = require("prismarine-viewer").mineflayer;
    // 寻路
    const pathfinder = require("mineflayer-pathfinder").pathfinder;
    const Movements = require("mineflayer-pathfinder").Movements;
    const { GoalNear } = require("mineflayer-pathfinder").goals;

    if (!res.tape) {
      seedMessage.tape = "err";
      seedMessage.mag = "tape不能为空";
      ws.send(JSON.stringify(seedMessage));
      return;
    }
    // 主动聊天
    if (res.tape == "chat") {
      if (!bot) {
        seedMessage.tape = "err";
        seedMessage.mag = "你还没有登录";
        ws.send(JSON.stringify(seedMessage));
        return;
      }
      bot.chat(res.date ?? "");
    }
    // bot信息
    if (res.tape == "info") {
      if (!bot) {
        seedMessage.tape = "err";
        seedMessage.mag = "你还没有登录";
        ws.send(JSON.stringify(seedMessage));
        return;
      }
      seedMessage.tape = "info";
      seedMessage.mag = "查询信息成功";
      seedMessage.date = {
        health: bot.health,
        food: bot.food,
        oxy: bot.oxygenLevel,
      };
      ws.send(JSON.stringify(seedMessage));
    }
    // 主动下线
    if (res.tape == "quit") {
      if (!bot) {
        seedMessage.tape = "err";
        seedMessage.mag = "你还没有登录";
        ws.send(JSON.stringify(seedMessage));
        return;
      }
      seedMessage.tape = "quit";
      seedMessage.mag = "机器人已下线";
      seedMessage.date = null;
      bot.quit();
      ws.send(JSON.stringify(seedMessage));
    }
    // 返回附近实体
    if (res.tape == "Entity") {
      if (!bot) {
        seedMessage.tape = "err";
        seedMessage.mag = "你还没有登录";
        ws.send(JSON.stringify(seedMessage));
        return;
      }
      seedMessage.tape = "Entity";
      seedMessage.mag = "实体获取成功";
      const entities = bot?.entities;
      const data = [];
      for (x in entities) {
        data.push({
          id: entities[x].id,
          username: entities[x].username,
          position: entities[x].position,
        });
        seedMessage.date = data;
        ws.send(JSON.stringify(seedMessage));
      }
      //
    }
    // 寻路
    if (res.tape == "Movements") {
      if (!bot) {
        seedMessage.tape = "err";
        seedMessage.mag = "你还没有登录";
        ws.send(JSON.stringify(seedMessage));
        return;
      }
      const mcData = require("minecraft-data")(bot.version);
      const defaultMove = new Movements(bot, mcData);
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(
        new GoalNear(res.date.x, res.date.y, res.date.z, 1)
      );
      seedMessage.tape = "Movements";
      seedMessage.mag = "移动成功！";
      ws.send(JSON.stringify(seedMessage));
    }
    // 攻击实体
    if (res.tape == "attack") {
      if (!bot) {
        seedMessage.tape = "err";
        seedMessage.mag = "你还没有登录";
        ws.send(JSON.stringify(seedMessage));
        return;
      }
      bot.attack(bot?.entities[res.date + ""]);
      seedMessage.tape = "attack";
      seedMessage.mag = "攻击实体成功";
      ws.send(JSON.stringify(seedMessage));
    }

    // 创建bot
    if (res.tape == "create") {
      const util = require("minecraft-server-util");
      if (!res.date.port) {
        res.date.port = util.parseAddress(res.date.host).port;
      }
      if (res.date.password) {
        bot = mineflayer.createBot({
          host: res.date.host,
          port: res.date.port,
          username: res.date.username, // minecraft username
          password: res.date.password,
          auth: "microsoft", // minecraft password, comment out if you want to log into online-mode=false servers
        });
        bot.loadPlugin(pathfinder);
      } else {
        console.log("未提供密码,准备盗版登录");
        bot = mineflayer.createBot({
          host: res.date.host,
          port: res.date.port,
          username: res.date.username, // minecraft username
        });
        bot.loadPlugin(pathfinder);
      }
      console.log(res.date);
      // 返回服务器信息
      util
        .status(res.date.host, parseInt(res.date.port ?? "25565"))
        .then((result) => {
          seedMessage.tape = "serverInfo";
          seedMessage.mag = "查询服务器成功！";
          seedMessage.date = result;
          ws.send(JSON.stringify(seedMessage));
        })
        .catch((error) => {
          seedMessage.tape = "serverInfo";
          seedMessage.mag = "查询服务器失败！";
          seedMessage.date = error;
        });

      // 登录事件监听
      bot?.once("spawn", () => {
        seedMessage.tape = "login";
        seedMessage.mag = "登录" + res.date.host + "服务器成功";
        console.log("发出数据===>\n" + JSON.stringify(seedMessage));
        ws.send(JSON.stringify(seedMessage));
        // 视图插件
        mineflayerViewer(bot, { port: 3007, firstPerson: true });
        // 防止afk
      });
      // 聊天事件监听
      bot?.on("chat", (username, message) => {
        seedMessage.tape = "chat";
        seedMessage.mag = "收到消息";
        seedMessage.date = { user: username, meg: message };
        console.log("发出数据===>\n" + JSON.stringify(seedMessage));
        ws.send(JSON.stringify(seedMessage));
      });
      // 血量，食物，氧气的检测！
      bot?.on("health", () => {
        seedMessage.tape = "info";
        seedMessage.mag = "查询信息成功";
        seedMessage.date = {
          health: bot.health,
          food: bot.food,
          oxy: bot.oxygenLevel,
        };
        ws.send(JSON.stringify(seedMessage));
      });

      bot?.on("breath", () => {
        seedMessage.tape = "info";
        seedMessage.mag = "查询信息成功";
        seedMessage.date = {
          health: bot.health,
          food: bot.food,
          oxy: bot.oxygenLevel,
        };
        ws.send(JSON.stringify(seedMessage));
      });
      bot?.on("kicked", (reason) => {
        seedMessage.tape = "kicked";
        seedMessage.mag = "服务器被踢出";
        seedMessage.date = reason;
        console.log("发出数据===>\n" + JSON.stringify(seedMessage));
        ws.send(JSON.stringify(seedMessage));
      });
      bot?.on("error", (err) => {
        seedMessage.tape = "error";
        seedMessage.mag = "出现错误";
        seedMessage.date = err.message;
        console.log("发出数据===>\n" + JSON.stringify(seedMessage));
        ws.send(JSON.stringify(seedMessage));
      });
    }
  });
});
