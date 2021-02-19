// deno-lint-ignore-file
/**
 * 缓存
 * @param timeKey
 */
export function cache(timeKey: string | number = "expires_in") {
  return function (_target: Object, _propertyKey: string, descriptor: PropertyDescriptor) {
    const oldFun = descriptor.value;
    let value: any = null;
    let next = -1;

    descriptor.value = async function (this: Object, ...args: any[]): Promise<any> {
      const now = +new Date();
      if (now < next) return value;
      const res = await oldFun.apply(this, args);
      value = res;
      next = now + (typeof timeKey === "number" ? timeKey : res[timeKey] - 120); // 防止边界，减 120s
      return res;
    };
  } as MethodDecorator;
}
