import { cache } from "../../utils/decorators.ts";
import request from "../../utils/request.ts";
import * as CustomerFuncs from "./customer.ts";

class WxWorkApp {
  constructor(private corpId: string, private secret: string) {
    Object.assign(this, CustomerFuncs);
  }
  @cache("expires_in")
  async getToken() {
    const res = await request<{ access_token: string; expires_in: number }>(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.corpId}&corpsecret=${this.secret}`,
    );
    return res;
  }
}

type CustomerFuncsTypes = typeof CustomerFuncs;
// deno-lint-ignore no-empty-interface
interface WxWorkApp extends CustomerFuncsTypes {}

export default WxWorkApp;

export { default as EventReceiver } from "./event-receiver.ts";
