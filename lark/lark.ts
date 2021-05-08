// deno-lint-ignore-file
import request from "../utils/request.ts";
import { cache } from "../utils/decorators.ts";

interface AuthRes {
  access_token: string; // user_access_token，用于获取用户资源
  avatar_url: string; // 用户头像
  avatar_thumb: string; // 用户头像 72x72
  avatar_middle: string; // 用户头像 240x240
  avatar_big: string; // 用户头像 640x640
  expires_in: number; // access_token 的有效期，单位: 秒
  name: string; // 用户姓名
  en_name: string; // 用户英文名称
  open_id: string; // 用户在应用内的唯一标识
  union_id: string; // 用户统一ID
  email: string; // 申请了"获取用户邮箱"权限的应用返回该字段
  user_id: string; // 申请了"获取用户 user_id"权限的应用返回该字段
  mobile: string; // 申请了"获取用户手机号"权限的应用返回该字段
  tenant_key: string; // 当前企业标识
  refresh_expires_in: number; // refresh_token 的有效期，单位: 秒
  refresh_token: string; // 刷新用户 access_token 时使用的 token
  token_type: "Bearer"; // 此处为 Bearer
}
interface GetUserInfoRes {
  name: string; // 用户姓名
  en_name: string; // 用户英文名称
  avatar_url: string; // 用户头像
  avatar_thumb: string; // 用户头像 72x72
  avatar_middle: string; // 用户头像 240x240
  avatar_big: string; // 用户头像 640x640
  user_id: string; // 申请了"获取用户 user_id"权限的应用返回该字段
  mobile: string; // 申请了"获取用户手机号"权限的应用返回该字段
  open_id: string; // 用户在应用内的唯一标识
  union_id: string; // 用户统一ID
  tenant_key: string; // 当前企业标识
}

class LarkApp {
  constructor(private app_id: string, private app_secret: string) {
  }
  @cache("expire")
  async getAppAccessToken() {
    const res = await request<{ app_access_token: string; expire: number }>(
      `https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal/`,
      {
        method: "POST",
        body: JSON.stringify({
          app_id: this.app_id,
          app_secret: this.app_secret,
        }),
      },
    );
    return res;
  }
  @cache("expire")
  async auth(code: string): Promise<AuthRes> {
    const { app_access_token } = await this.getAppAccessToken();
    const res = await request<{ data: AuthRes }>(
      `https://open.feishu.cn/open-apis/authen/v1/access_token`,
      {
        method: "POST",
        body: JSON.stringify({
          grant_type: "authorization_code",
          app_access_token,
          code,
        }),
      },
    );
    return res.data;
  }
  async getUserInfo(user_access_token: string) {
    return await request<GetUserInfoRes>(
      `https://open.feishu.cn/open-apis/authen/v1/user_info?user_access_token=${user_access_token}`,
      {
        headers: {
          Authorization: `Bearer ${user_access_token}`,
        },
      },
    );
  }
}

export default LarkApp;
