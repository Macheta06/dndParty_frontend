import { describe, expect, it } from "vitest";
import axios from "axios";

import { apiErrorMessage } from "./api-error";

const axiosError = (data: unknown, status = 400) =>
  new axios.AxiosError(
    "Request failed with status code 400",
    "ERR_BAD_REQUEST",
    {} as never,
    {},
    {
      status,
      statusText: "Bad Request",
      headers: {},
      config: {},
      data,
    } as never,
  );

describe("apiErrorMessage", () => {
  it("uses the server message over axios' generic one", () => {
    const err = axiosError({
      statusCode: 400,
      message: "«Gran hacha» necesita ambas manos. Desequipa antes: Escudo",
    });

    expect(apiErrorMessage(err, "fallback")).toContain("ambas manos");
  });

  it("joins validation messages when the server returns an array", () => {
    const err = axiosError({ message: ["name must be a string", "level min 1"] });

    expect(apiErrorMessage(err, "fallback")).toBe(
      "name must be a string, level min 1",
    );
  });

  it("falls back when the body carries no message", () => {
    const err = axiosError({ statusCode: 500 });

    expect(apiErrorMessage(err, "Error al equipar")).toBe("Error al equipar");
  });

  it("uses the message of a plain Error", () => {
    expect(apiErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back for anything else", () => {
    expect(apiErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(apiErrorMessage("string", "fallback")).toBe("fallback");
  });
});
