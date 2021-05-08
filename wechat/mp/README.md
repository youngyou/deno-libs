# 微信公众号

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
