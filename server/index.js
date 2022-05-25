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
  //监听通信
  ws.on("message", (message) => {
    console.log("客户端信息：" + message);
    var res = JSON.parse(message);
    const mineflayer = require("mineflayer");
    if (!res.tape) {
      seedMessage.tape = "err";
      seedMessage.mag = "tape不能为空";
      ws.send(JSON.stringify(seedMessage));
      return;
    }
    if (res.tape == "chat") {
      if (!bot) {
        seedMessage.tape = "err";
        seedMessage.mag = "你还没有登录";
        ws.send(JSON.stringify(seedMessage));
        return;
      }
      bot.chat(res.date ?? "");
    }
    if (res.tape == "create") {
      const util = require("minecraft-server-util");
      if (res.date.port) {
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
      } else {
        console.log("为提供密码,准备盗版登录");
        bot = mineflayer.createBot({
          host: res.date.host,
          port: res.date.port,
          username: res.date.username, // minecraft username
        });
      }
      bot?.on("login", () => {
        seedMessage.tape = "login";
        seedMessage.mag = "登录" + res.date.host + "服务器成功";
        console.log("发出数据===>\n" + JSON.stringify(seedMessage));
        ws.send(JSON.stringify(seedMessage));
      });

      bot?.on("chat", (username, message) => {
        seedMessage.tape = "chat";
        seedMessage.mag = "收到消息";
        seedMessage.date = { user: username, meg: message };
        console.log("发出数据===>\n" + JSON.stringify(seedMessage));
        ws.send(JSON.stringify(seedMessage));
      });
      /*
      bot.on("playerJoined", (player) => {
        if (player == bot) return;
        seedMessage.tape = "playerJoined";
        seedMessage.mag = "玩家加入";
        seedMessage.date = player.displayName;
        console.log("发出数据===>\n" + JSON.stringify(seedMessage));
        ws.send(JSON.stringify(seedMessage));
      });
			*/
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
