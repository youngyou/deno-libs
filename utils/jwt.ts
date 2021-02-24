import {
  Algorithm,
  Context,
  jwtCreate,
  jwtVerify,
  Middleware,
  Payload,
} from "../deps.ts";

function jwt(secret: string, alg: Algorithm = "HS512") {
  async function create(data: Payload) {
    return await jwtCreate({ alg, typ: "JWT" }, data, secret);
  }
  async function parse<T extends Payload = Payload>(token: string) {
    const text = token.startsWith("Bearer ") ? token.slice(7) : token;
    const payload = await jwtVerify(text, secret, alg);
    return payload as T;
  }

  function middleware<T extends Payload = Payload>(
    fun: (payload: T | null, ctx: Context, next: () => Promise<void>) => void,
  ): Middleware {
    return async function (ctx: Context, next: () => Promise<void>) {
      const authHeader = ctx.request.headers.get("Authorization")!;
      let payload = null;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          payload = await parse<T>(authHeader);
        } catch (e) {
          console.log(e);
        }
      }
      await fun(payload, ctx, next);
    };
  }
  return {
    create,
    parse,
    middleware,
  };
}

export default jwt;
