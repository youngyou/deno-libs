// deno-lint-ignore-file
import { Logger } from "../../utils/logger.ts";
import { Sha1 } from "../../deps.ts";

const logger = new Logger();

function sort(...strs: string[]): string {
  return strs.sort().join("");
}

function sha1(value: string) {
  const algorithm = new Sha1();
  return algorithm.update(value).toString();
}

export function verify(signature: string, ...values: string[]) {
  const str = sort(...values);
  const hash = sha1(str);
  const result = hash === signature;
  if (!result) {
    logger.info(
      `WxWork verify failed: \n\texpected: ${signature} \n\tgot: ${hash} \n\tsort: ${str} \n\tsource:`,
      values,
    );
  }
  return result;
}

export function Utf8ArrayToString(array: Uint8Array) {
  let char2, char3;
  let out = "";
  let i = 0;
  while (i < array.length) {
    const c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0),
        );
        break;
    }
  }

  return out;
}
