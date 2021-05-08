# 飞书

### demo

```typescript
const app = new LarkApp("APP_ID", "SECRET");

router.post("/auth", async (context) => {
  try {
    const { code } = await context.request.body({ type: "json" }).value;
    const { user_id, access_token } = await app.auth(code);
    console.log(await app.getUserInfo(access_token));
    console.log("user_id");
    // ...
  } catch (e) {
    // ...
  }
});
```
