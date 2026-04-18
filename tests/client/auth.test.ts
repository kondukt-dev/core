import { describe, expect, it } from "vitest";
import { buildAuthHeaders } from "../../src/client/auth.js";

describe("buildAuthHeaders", () => {
  it("returns empty object when auth is undefined", () => {
    expect(buildAuthHeaders(undefined)).toEqual({});
  });

  it("returns empty object for auth type none", () => {
    expect(buildAuthHeaders({ type: "none" })).toEqual({});
  });

  it("returns Authorization bearer header", () => {
    expect(buildAuthHeaders({ type: "bearer", token: "abc" })).toEqual({
      Authorization: "Bearer abc",
    });
  });

  it("returns custom api-key header", () => {
    expect(
      buildAuthHeaders({ type: "api-key", headerName: "X-API-Key", value: "xyz" }),
    ).toEqual({ "X-API-Key": "xyz" });
  });

  it("returns custom headers as-is", () => {
    expect(
      buildAuthHeaders({
        type: "custom",
        headers: { "X-Foo": "bar", "X-Baz": "qux" },
      }),
    ).toEqual({ "X-Foo": "bar", "X-Baz": "qux" });
  });
});
