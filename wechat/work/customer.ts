// deno-lint-ignore-file camelcase

import request from "../../utils/request.ts";
import WxWorkApp from "./wx-work.ts";

type SendWelcomeParams = Partial<{
  text: {
    content: string;
  };
  image: { media_id: string } | { pic_url: string };
  link: {
    title: string; // 图文消息标题，最长为128字节
    picurl?: string; // 图文消息封面的url
    desc?: string; // 图文消息的描述，最长为512字节
    url: string; // 图文消息的链接
  };
  miniprogram: {
    title: string; // 小程序消息标题，最长为64字节
    pic_media_id: string; // 小程序消息封面的mediaid，封面图建议尺寸为520*416
    appid: string; //小程序appid，必须是关联到企业的小程序应用
    page: string; // 小程序page路径
  };
}>;

interface AddContactWayFullParams {
  type: 1 | 2; // 联系方式类型,1-单人, 2-多人
  scene: 1 | 2; // 场景，1-在小程序中联系，2-通过二维码联系
  style?: number; // 在小程序中联系时使用的控件样式，详见附表
  remark?: string; // 联系方式的备注信息，用于助记，不超过30个字符
  skip_verify?: boolean; // 外部客户添加时是否无需验证，默认为true
  state?: string; // 企业自定义的state参数，用于区分不同的添加渠道，在调用“获取外部联系人详情”时会返回该参数值，不超过30个字符
  user?: string[]; // 使用该联系方式的用户userID列表，在type为1时为必填，且只能有一个
  party?: string; // 使用该联系方式的部门id列表，只在type为2时有效
  is_temp?: boolean; // 是否临时会话模式，true表示使用临时会话模式，默认为false
  expires_in?: number; // 临时会话二维码有效期，以秒为单位。该参数仅在is_temp为true时有效，默认7天
  chat_expires_in?: number; // 临时会话有效期，以秒为单位。该参数仅在is_temp为true时有效，默认为添加好友后24小时
  unionid?: string; // 可进行临时会话的客户unionid，该参数仅在is_temp为true时有效，如不指定则不进行限制
  conclusions?: string; // 结束语，会话结束时自动发送给客户，可参考“结束语定义”，仅在is_temp为true时有效
}

type AddContactWayParams =
  & Omit<
    AddContactWayFullParams,
    | "type"
    | "is_temp"
    | "expires_in"
    | "chat_expires_in"
    | "unionid"
    | "conclusions"
    | "party"
    | "user"
  >
  & ({ user: string[] } | { party: string });

interface ExternalContact {
  external_userid: string; // 外部联系人的userid
  name: string; // 外部联系人的名称 如果外部联系人为微信用户，则返回外部联系人的名称为其微信昵称；如果外部联系人为企业微信用户，则会按照以下优先级顺序返回：此外部联系人或管理员设置的昵称、认证的实名和账号名称。
  position: string; // 外部联系人的职位，如果外部企业或用户选择隐藏职位，则不返回，仅当联系人类型是企业微信用户时有此字段
  avatar: string; // 外部联系人头像，第三方不可获取
  corp_name: string; // 外部联系人所在企业的简称
  corp_full_name: string; // 外部联系人所在企业的主体名称，仅当联系人类型是企业微信用户时有此字段
  type: 1 | 2; // 外部联系人的类型，1表示该外部联系人是微信用户，2表示该外部联系人是企业微信用户
  gender: 0 | 1 | 2; // 外部联系人性别 0-未知 1-男性 2-女性
  unionid: string; // 外部联系人在微信开放平台的唯一身份标识（微信unionid），通过此字段企业可将外部联系人与公众号/小程序用户关联起来。仅当联系人类型是微信用户，且企业或第三方服务商绑定了微信开发者ID有此字段。查看绑定方法

  follow_user: Array<{
    // 添加了此外部联系人的企业成员
    userid: string; // 添加了此外部联系人的企业成员userid
    remark: string; // 该成员对此外部联系人的备注
    description: string; // 该成员对此外部联系人的描述
    createtime: number; // 该成员添加此外部联系人的时间
    tags: [
      {
        group_name: string; // 该成员添加此外部联系人所打标签的分组名称（标签功能需要企业微信升级到2.7.5及以上版本）
        tag_name: string; // 该成员添加此外部联系人所打标签名称
        tag_id: string; // 该成员添加此外部联系人所打企业标签的id，仅企业设置（type为1）的标签返回
        type: 1 | 2; // 该成员添加此外部联系人所打标签类型, 1-企业设置, 2-用户自定义
      },
    ];
    remark_corp_name: string; // 该成员对此客户备注的企业名称
    remark_mobiles: string[]; // 该成员对此客户备注的手机号码，第三方不可获取
    oper_userid: string; // 发起添加的userid，如果成员主动添加，为成员的userid；如果是客户主动添加，则为客户的外部联系人userid；如果是内部成员共享/管理员分配，则为对应的成员/管理员userid
    /**
     * 该成员添加此客户的来源: 0.未知来源; 1.扫描二维码; 2.搜索手机号; 3.名片分享; 4.群聊; 5.手机通讯录; 6.微信联系人; 7.来自微信的添加好友申请; 8.安装第三方应用时自动添加的客服人员; 9.搜索邮箱; 201.内部成员共享; 202.管理员/负责人分配
     */
    add_way: 1;
    state: string; // 企业自定义的state参数，用于区分客户具体是通过哪个「联系我」添加，由企业通过创建「联系我」方式指定
  }>;
}

/**
 * 发送新客户欢迎语
 * @param code
 * @param params
 */
export async function sendWelcome(
  this: WxWorkApp,
  code: string,
  params: SendWelcomeParams,
) {
  const { access_token } = await this.getToken();
  const res = await request(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/send_welcome_msg?debug=1&access_token=${access_token}`,
    {
      method: "POST",
      body: JSON.stringify({ welcome_code: code, ...params }),
    },
  );
  return res;
}

export async function getFollowUserList(this: WxWorkApp) {
  const { access_token } = await this.getToken();
  return (
    await request<{ follow_user: string[] }>(
      `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/get_follow_user_list?access_token=${access_token}`,
    )
  ).follow_user;
}

/**
 * 配置客户联系「联系我」方式
 * @param params
 */
export async function addContactWay(
  this: WxWorkApp,
  params: AddContactWayParams,
) {
  const { access_token } = await this.getToken();
  return await request(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/add_contact_way?access_token=${access_token}`,
    {
      method: "POST",
      body: JSON.stringify({
        type: 2, // 联系方式类型,1-单人, 2-多人
        ...params,
      }),
    },
  );
}

/**
 * 获取企业已配置的「联系我」方式
 * @param this
 * @param configId
 */
export async function getContactWay(this: WxWorkApp, configId: string) {
  const { access_token } = await this.getToken();
  return await request<{
    contact_way: AddContactWayFullParams & { config_id: string };
  }>(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/get_contact_way?access_token=${access_token}`,
    {
      method: "POST",
      body: JSON.stringify({ config_id: configId }),
    },
  );
}
/**
 * 获取企业已配置的「联系我」方式
 * @param this
 * @param configId
 */
export async function delContactWay(this: WxWorkApp, configId: string) {
  const { access_token } = await this.getToken();
  return await request(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/del_contact_way?access_token=${access_token}`,
    {
      method: "POST",
      body: JSON.stringify({ config_id: configId }),
    },
  );
}
/**
 * 获取客户详情
 * @param externalUserid
 */
export async function getExternalContact(
  this: WxWorkApp,
  externalUserid: string,
) {
  const { access_token } = await this.getToken();
  return await request<ExternalContact>(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/get?access_token=${access_token}&external_userid=${externalUserid}`,
  );
}

export async function getExternalContactList(this: WxWorkApp, userid: string) {
  const { access_token } = await this.getToken();
  return await request<{ external_userid: string[] }>(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/list?access_token=${access_token}&userid=${userid}`,
  );
}

/**
 * 获取部门成员
 * @param this 
 * @param department_id 
 */
export async function getUserList(this: WxWorkApp, department_id: number) {
  const { access_token } = await this.getToken();
  // deno-lint-ignore no-explicit-any
  return await request<any>(
    `https://qyapi.weixin.qq.com/cgi-bin/user/simplelist?access_token=${access_token}&department_id=${department_id}&fetch_child=1`,
  );
}
