// deno-lint-ignore-file camelcase

import { cache } from "../../utils/decorators.ts";
import request from "../../utils/request.ts";
import { Sha1, nanoid } from "../../deps.ts";

interface GetToken {
  access_token: string;
  expires_in: number;
}
interface GetJsTicket {
  ticket: string;
  expires_in: number;
}
interface GetAccessToken {
  access_token: string; // 网页授权接口调用凭证,注意：此access_token与基础支持的access_token不同
  expires_in: number; // access_token接口调用凭证超时时间，单位（秒）
  refresh_token: string; // 用户刷新access_token
  openid: string; // 用户唯一标识，请注意，在未关注公众号时，用户访问公众号的网页，也会产生一个用户和公众号唯一的OpenID
  scope: string; // 用户授权的作用域，使用逗号（,）分隔
}
interface GetUserInfo {
  openid: string;
  nickname: string;
  sex: 0 | 1 | 2; // 用户的性别，值为1时是男性，值为2时是女性，值为0时是未知
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  // deno-lint-ignore no-explicit-any
  privilege: any[]; // 用户特权信息，json 数组，如微信沃卡用户为（chinaunicom）
  unionid: string;
}

class WxMp {
  constructor(private appid: string, private secret: string) {}

  /**
   * 获取 Access token
   */
  @cache("expires_in")
  async getToken() {
    return await request<GetToken>(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`
    );
  }
  /**
   * 获取 jsapi_ticket
   */
  @cache("expires_in")
  async getJsTicket() {
    const { access_token } = await this.getToken();
    return await request<GetJsTicket>(
      `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${access_token}&type=jsapi`
    );
  }
  /**
   * 通过code换取网页授权access_token
   * @param code
   */
  async getAccessToken(code: string) {
    const res = await request<GetAccessToken>(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.appid}&secret=${this.secret}&code=${code}&grant_type=authorization_code`
    );
    return res;
  }
  /**
   * 拉取用户信息(需scope为 snsapi_userinfo)
   * @param openid 用户的唯一标识
   * @param access_token 网页授权接口调用凭证,注意：此access_token与基础支持的access_token不同
   */
  async getUserInfo(openid: string, access_token: string) {
    const userinfo = await request<GetUserInfo>(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
    );

    return userinfo;
  }
  async getJsConfig(url: string) {
    const { ticket } = await this.getJsTicket();
    const noncestr = nanoid(16);
    const timestamp = Math.floor(+new Date() / 1000);

    const obj: Record<string, string | number> = {
      noncestr,
      jsapi_ticket: ticket,
      timestamp,
      url: url.split("#")[0]
    };
    const str = Object.keys(obj)
      .map(k => `${k}=${obj[k]}`)
      .sort()
      .join("&");
    console.log(str);
    const algorithm = new Sha1();
    const signature = algorithm.update(str).toString();
    return {
      nonceStr: noncestr,
      timestamp,
      signature
    };
  }
}

export default WxMp;
