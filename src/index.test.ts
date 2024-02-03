import { beforeEach, expect, it, vi } from "vitest";

import Gauk from ".";

const fetchMock = vi.fn(fetch);
globalThis.fetch = fetchMock;

beforeEach(() => {
    fetchMock.mockClear();

    fetchMock.mockResolvedValue(new Response(JSON.stringify({ a: "b" })));
});

it.each(["GET", "POST", "PUT", "DELETE"] as const)("makes simple %s request", async method => {
    const gauk = new Gauk();
    const url = "/foo";

    let data: any;

    switch (method) {
        case "GET":
            data = (await gauk.get(url)).data;
            break;
        case "POST":
            data = (await gauk.post(url, {})).data;
            break;
        case "PUT":
            data = (await gauk.put(url, {})).data;
            break;
        case "DELETE":
            data = (await gauk.del(url)).data;
            break;
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
            method,
        })
    );

    expect(data).toStrictEqual({ a: "b" });
});

it("does not throw on invalid response values, but returns undefined", async () => {
    fetchMock.mockResolvedValue(new Response(`{"hello": 45,6 }`));

    const { data } = await new Gauk().get("foo");

    expect(data).toBe(undefined);
});

it("returns json when responseType is json", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ foo: "bar" })));

    const { data } = await new Gauk().get("foo", { responseType: "json" });

    expect(data).toStrictEqual({ foo: "bar" });
});

it("returns string when responseType is text", async () => {
    fetchMock.mockResolvedValue(new Response("foobar"));

    const { data } = await new Gauk().get("foo", { responseType: "text" });

    expect(data).toBe("foobar");
});

it("returns blob when responseType is blob", async () => {
    fetchMock.mockResolvedValue(new Response(new Blob()));

    const { data } = await new Gauk().get("foo", { responseType: "blob" });

    expect(data).toBeInstanceOf(Blob);
});

it("can't override method", async () => {
    await new Gauk().get("foo", { method: "POST" });

    expect(fetchMock).toHaveBeenCalledWith(
        "foo",
        expect.objectContaining({
            method: "GET",
        })
    );
});

it("user options override default provided options", async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    fetchMock.mockImplementation(async (_url, options) => {
        const headers = options?.headers as Headers | undefined;

        expect(headers?.get("Accept")).toBe("text/html");
        expect(headers?.get("Content-type")).toBe("application/json");

        return new Response();
    });

    const gauk = new Gauk({
        options: {
            baseUrl: "/baseUrl",
            referrer: "foo",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        },
    });

    await gauk.get("foo", {
        headers: {
            Accept: "text/html",
        },
        referrer: "foobar",
    });

    expect(fetchMock).toHaveBeenCalledWith(
        "/baseUrl/foo",
        expect.objectContaining({
            baseUrl: "/baseUrl",
            referrer: "foobar",
        })
    );
});

it("beforeRequest hook gets correct url and options", async () => {
    const beforeRequest = vi.fn();

    const gauk = new Gauk({
        options: {
            baseUrl: "/wrong",
        },

        beforeRequest: [beforeRequest],
    });

    await gauk.get("/foo", { baseUrl: "/baseUrl" });

    expect(beforeRequest).toHaveBeenCalledTimes(1);
    expect(beforeRequest).toHaveBeenCalledWith(
        "/baseUrl/foo",
        expect.objectContaining({
            baseUrl: "/baseUrl",
        })
    );
});

it("beforeRequest hooks get called serially", async () => {
    let count = 0;

    const waitRandom = () =>
        new Promise(res => setTimeout(res, Math.floor(Math.random() * 100)));

    const beforeRequest1 = vi.fn().mockImplementation(async () => {
        expect(count).toBe(0);

        await waitRandom();
        count += 1;

        expect(count).toBe(1);
    });

    const beforeRequest2 = vi.fn().mockImplementation(async () => {
        expect(count).toBe(1);

        await waitRandom();
        count += 1;

        expect(count).toBe(2);
    });

    const gauk = new Gauk({
        beforeRequest: [beforeRequest1, beforeRequest2],
    });

    await gauk.get("foo");

    expect(beforeRequest1).toHaveBeenCalledTimes(1);
    expect(beforeRequest2).toHaveBeenCalledTimes(1);
});

it("beforeRequest hooks can change options", async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    fetchMock.mockImplementation(async (_url, options) => {
        const headers = options?.headers as Headers | undefined;

        expect(headers?.get("Foo-Bar")).toBe("foo");

        return new Response();
    });

    const gauk = new Gauk({
        beforeRequest: [
            // eslint-disable-next-line @typescript-eslint/require-await
            async (_url, options) => {
                options.headers?.set("Foo-Bar", "foo");
            },
        ],
    });

    await gauk.get("/foo");
});
