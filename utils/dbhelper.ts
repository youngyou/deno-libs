// deno-lint-ignore-file no-explicit-any

import { Client, ClientConfig, configLogger, ExecuteResult, Logger, TransactionProcessor } from "../deps.ts";

const logger = new Logger({
  format: "DB ==> %s"
});

export default class DBHelper {
  db!: Client;

  constructor(options?: ClientConfig, debug = false) {
    if (options) this.connect(options);
    debug && configLogger({ enable: true, level: "DEBUG" });
  }

  async connect(options: ClientConfig) {
    this.db = new Client();
    await this.db.connect(options);
  }

  async close() {
    await this.db.close();
  }

  async query<T>(sql: string, params?: any[]) {
    logger.info(`QUERY: "${sql}", PARAMS: ${JSON.stringify(params || [])}`);
    try {
      return (await this.db.query(sql, params)) as Promise<T[]>;
    } catch (e) {
      logger.error(`${e.message}`);
      throw e;
    }
  }

  async queryOne<T>(sql: string, params?: any[]): Promise<T | undefined> {
    logger.info(`QUERY ONE: "${sql}", PARAMS: ${JSON.stringify(params || [])}`);
    try {
      const list = (await this.db.query(sql, params)) as T[];
      return list[0];
    } catch (e) {
      logger.error(`${e.message}`);
      throw e;
    }
  }

  async execute(sql: string, params?: any[]): Promise<ExecuteResult> {
    logger.info(`EXECUTE: "${sql}", PARAMS: ${JSON.stringify(params || [])}`);
    try {
      return await this.db.execute(sql, params);
    } catch (e) {
      logger.error(`${e.message}`);
      throw e;
    }
  }

  async transaction<T = any>(processor: TransactionProcessor<T>): Promise<T> {
    return await this.db.transaction(processor);
  }
}
