# 微信小程序

## demo

```typescript
const app = new WxMiniApp("APP_ID", "SECRET");

router.post("/auth", async (context) => {
  try {
    const { code } = await context.request.body({ type: "json" }).value;
    const { openid, session_key, unionid } = await app.code2Session(code);
    // ...
  } catch (e) {
    // ...
  }
});
```
