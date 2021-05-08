# 企业微信

## demo

```typescript
const app = new WxMiniApp("APP_ID", "SECRET");

router.post("/auth", async (context) => {
  try {
    const { code } = await context.request.body({ type: "json" }).value;
    const { access_token, openid } = await wxH5.getAccessToken(code);
    const userinfo = await wxH5.getUserInfo(openid, access_token);
    // ...
  } catch (e) {
    // ...
  }
});
```

## 通知回调

```typescript
const evReceiver = new WxWorkEventReceiver("TOKEN", "AES_KEY");
const app = new WxWorkApp("CORPID", "secret");

// 接收消息服务器设置URL验证
router.get("/events", async (context) => {
  const { msg_signature, timestamp, nonce, echostr } = helpers.getQuery(
    context,
  );
  if (!evReceiver.verify(msg_signature, echostr, nonce, timestamp)) {
    context.response.status = 400;
    return;
  }
  const { message } = await evReceiver.decode(echostr);
  console.log("message", message);
  context.response.body = message;
});

router.post("/events", async (context) => {
  const { msg_signature, timestamp, nonce } = helpers.getQuery(context);
  const xmlBody = await context.request.body({ type: "text" }).value;

  const { ToUserName, Encrypt, AgentID } = parse(xmlBody).xml as {
    ToUserName: string;
    Encrypt: string;
    AgentID: string;
  };
  if (!evReceiver.verify(msg_signature, Encrypt, nonce, timestamp)) {
    context.response.status = 400;
    return;
  }

  const { json } = await evReceiver.decode(Encrypt);
  console.log("mssg", json);
  if (json?.ChangeType === "add_external_contact") {
    // 添加客户
    // await app.sendWelcome(json.WelcomeCode, {
    //   text: { content: "你好，请打开链接 https://justso.cool 关注" },
    //   image: {
    //     pic_url: "https://justso.cool/css/images/banner.jpeg",
    //   },
    // });
  }
});
```
