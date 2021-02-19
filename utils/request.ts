import { Logger } from "../utils/logger.ts";

const logger = new Logger();

// deno-lint-ignore no-explicit-any
export default async function request<T = any>(
  input: Request | URL | string,
  init?: RequestInit
): Promise<T> {
  logger.info(
    "REQ ==> %s %s %s",
    init?.method || "GET",
    input,
    JSON.stringify(init?.body, undefined, "  ") || ""
  );
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (response.status >= 400) {
    throw new Error(response.statusText);
  }
  const json = await response.json();
  const { errcode, errmsg, code, msg, ...value } = json;
  logger.info(
    "RES ==> %s %s",
    `STATUS(${errcode || code}, ${errmsg || msg})`,
    JSON.stringify(json, undefined, "  ") || ""
  );
  if ((errcode && errcode !== 200) || (code && code !== 200)) {
    throw new Error(`${errcode || code}: ${errmsg || msg}`);
  }
  return value as T;
}
