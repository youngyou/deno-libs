// Copyright 2020 the oak authors. All rights reserved. MIT license.

import { Context } from "../deps.ts";
import { test, assertEquals, assert } from "../test_deps.ts";
import JWT from "./jwt.ts";
 
const jwt = JWT("DB726D13-9A31-4682-B309-55CE304684C3");

test({
  name: "ok",
  async fn() {
    const token = await jwt.create({ id: 1 });
    const mockContext = {
      request: {
        headers: new Headers({ Authorization: `Bearer ${token}` })
      },
      state: {},
      response: {}
    } as Context;
    const mockNext = () => {
      assertEquals(mockContext.state.jwt.id, 1);
      assertEquals(mockContext.response.status === 401, false);
      return new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 50);
      });
    };
    await jwt.middleware()(mockContext, mockNext);
  }
});
test({
  name: "fail",
  async fn() {
    const mockContext = {
      request: {
        headers: new Headers({ Authorization: "123456" })
      },
      response: {}
    } as Context;
    const mockNext = () => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 50);
      });
    };
    await jwt.middleware()(mockContext, mockNext);
    assertEquals(mockContext.response.status === 401, true);
  }
});
