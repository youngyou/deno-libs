import { Payload, Algorithm, jwtCreate, jwtVerify, Middleware, Context } from "../deps.ts";

// deno-lint-ignore no-explicit-any
type PayloadParse = (payload: Payload) => Record<string, any> | Promise<Record<string, any>>;

function defautParsePayload(payload: Payload) {
  return { jwt: payload };
}
function defaultOnError(ctx: Context, _e: Error) {
  ctx.response.status = 401;
  return;
}

function jwt(secret: string, alg: Algorithm = "HS512") {
  async function create(data: Payload) {
    return await jwtCreate({ alg, typ: "JWT" }, data, secret);
  }
  async function parse(token: string) {
    const text = token.startsWith("Bearer ") ? token.slice(7) : token;
    return await jwtVerify(text, secret, alg);
  }

  function middleware(parsePayload: PayloadParse = defautParsePayload, onError = defaultOnError): Middleware {
    return async function (ctx, next) {
      const authHeader = ctx.request.headers.get("Authorization")!;
      if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.length <= 7) {
        onError(ctx, new Error("JWT not found"));
        return;
      }
      try {
        const payload = await parse(authHeader);
        const data = await parsePayload(payload);
        const keys = Object.keys(data);
        keys.forEach(k => {
          ctx.state[k] = data[k];
        });
        await next();
        keys.forEach(k => {
          delete ctx.state[k];
        });
      } catch (e) {
        onError(ctx, e);
        return;
      }
    };
  }
  return {
    create,
    parse,
    middleware
  };
}

export default jwt;
