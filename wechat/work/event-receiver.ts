// deno-lint-ignore-file camelcase

import { AES, decode } from "../../deps.ts";
import { parse } from "../../utils/xml.ts";
import { Utf8ArrayToString, verify } from "./utils.ts";

interface EventMessage {
  msg_signature: string; // 企业微信加密签名，msg_signature结合了企业填写的token、请求中的timestamp、nonce参数、加密的消息体
  timestamp: string; // 时间戳
  nonce: string; // 随机数
  msg_encrypt: string; // 加密的字符串。需要解密得到消息内容明文，解密后有random、msg_len、msg、CorpID四个字段，其中msg即为消息内容明文
}

type MsgType = "event";

interface EventBase {
  ToUserName: string;
  FromUserName: "sys";
  CreateTime: string;
  MsgType: MsgType;
}

// deno-lint-ignore no-explicit-any
type ChangeExternalContactEventBase<Type, Data = any> = EventBase & {
  Event: "change_external_contact";
  ChangeType: Type;
  UserID: string;
  ExternalUserID: string;
} & Data;

export type ChangeExternalContactEvent =
  | ChangeExternalContactEventBase<
    "add_external_contact" | "add_half_external_contact",
    { WelcomeCode: string; State: string }
  > // 添加企业客户事件 | 外部联系人免验证添加成员事件
  | ChangeExternalContactEventBase<
    "edit_external_contact" | "del_external_contact" | "del_follow_user"
  > // 编辑企业客户事件 | 删除企业客户事件 | 删除跟进成员事件
  | ChangeExternalContactEventBase<
    "transfer_fail",
    {
      FailReason: "customer_refused" | "customer_limit_exceed"; // 客户拒绝 | 接替成员的客户数达到上限
    }
  >; // 客户接替失败事件

// 客户群创建事件 | 客户群变更事件 | 客户群解散事件
export type ChangeExternalChatEvent = EventBase & {
  Event: "change_external_chat";
  ChangeType: "create" | "update" | "dismiss";
  ChatId: string;
};
// 企业客户标签创建事件 | 企业客户标签变更事件 | 企业客户标签删除事件
export type ChangeExternalTagEvent = EventBase & {
  Event: "change_external_tag";
  Id: string;
  TagType: "tag_group";
  ChangeType: "create" | "update" | "delete";
};

class WxWorkEventReceiver {
  private aesKey: Uint8Array;
  private aes: AES;
  constructor(private token: string, encodingAESKey: string) {
    this.aesKey = decode(encodingAESKey + "=");
    this.aes = new AES(this.aesKey);
  }
  verify(
    signature: string,
    encryptMsg: string,
    nonce: number | string,
    timestamp: number | string,
  ) {
    return verify(
      signature,
      this.token,
      encryptMsg,
      String(nonce),
      String(timestamp),
    );
  }
  private parseLength(bytes: Uint8Array) {
    let len = 0;
    for (let i = 0; i < 4; i++) {
      len <<= 8;
      len |= bytes[i] & 0xff;
    }
    return len;
  }
  async decode(msgEncrypt: string) {
    const aesMsg = decode(msgEncrypt);
    const randMsg = await this.aes.decrypt(aesMsg);
    const msgLen = this.parseLength(randMsg.subarray(16, 20));
    const msg = Utf8ArrayToString(randMsg.subarray(20, 20 + msgLen));
    const receiveid = String.fromCharCode.apply(null, [
      ...randMsg.subarray(20 + msgLen),
    ]);
    if (msg.startsWith("<")) {
      const msgBody = parse(msg) as {
        xml:
          | ChangeExternalChatEvent
          | ChangeExternalContactEvent
          | ChangeExternalTagEvent;
      };
      return {
        message: msg,
        json: msgBody.xml,
        receiveid: receiveid,
      };
    }

    return {
      message: msg,
      receiveid: receiveid,
    };
  }
}

export default WxWorkEventReceiver;
