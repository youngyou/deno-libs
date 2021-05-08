// deno-lint-ignore-file camelcase

import { cache } from "../../utils/decorators.ts";
import request from "../../utils/request.ts";

interface GetToken {
  access_token: string;
  expires_in: number;
}
interface GetCode2Session {
  openid: string;
  session_key: string;
  unionid: string;
}

class WxMiniApp {
  constructor(private appid: string, private secret: string) {}

  /**
   * 获取小程序全局唯一后台接口调用凭据（access_token）。调用绝大多数后台接口时都需使用 access_token，开发者需要进行妥善保存。
   */
  @cache("expires_in")
  async getToken() {
    return await request<GetToken>(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`,
    );
  }
  /**
   * 登录凭证校验。通过 wx.login 接口获得临时登录凭证 code 后传到开发者服务器调用此接口完成登录流程。更多使用方法详见 小程序登录。
   * @param js_code 登录时获取的 code
   */
  async code2Session(js_code: string) {
    return await request<GetCode2Session>(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${this.appid}&secret=${this.secret}&js_code=${js_code}&grant_type=authorization_code`,
    );
  }
  // async getSchema() {
  //   const { access_token } = await this.getToken();
  //   await request<any>(`https://api.weixin.qq.com/wxa/generatescheme?access_token=${access_token}`, {
  //     method: "POST",
  //     body: JSON.stringify({
  //       jump_wxa: {
  //         path: "",
  //         query: ""
  //       }
  //     })
  //   });
  // }
}

export default WxMiniApp;
