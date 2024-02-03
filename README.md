<h1 align="center">Gauk 🇱🇹</h1>

<br />

<div align="center">

<img src="https://img.shields.io/bundlephobia/minzip/gauk?style=flat-square" />
<img src="https://img.shields.io/npm/v/gauk?style=flat-square" />
 
</div>

## The what

The axios inspired fetch wrapper

## Why not just use X?

Why I needed a new fetch wrapper:

-   Wrappers throw on invalid responses, I want it to return `undefined`, if response status is successful
-   Wrappers are complicated, I need simple get,post,put and some `beforeRequest` hooks
-   Almost all wrappers are pretty big, `Gauk` is `1kb gzip`
-   `Gauk` normalizes all headers
-   I need a fetch wrapper that throws on error response codes

## Install

```
pnpm i gauk
```

## Usage

Simple Usage

```ts
const gauk = new Gauk({
    // provide default options
    options: {
        responseType: "json", // json is default
        baseUrl: "/baseUrl",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    },

    beforeRequest: [
        // hooks are run serially and get the final url + final options
        async (_url, options) => {
            options.headers?.set("Foo-Bar", "foo");
        },
    ],
});

const { data } = await gauk.get<Generic>("/url", {
    // override options here
});
```

## How request body is parsed into fetch body

The easiest way to explain is just to show the code,
(I may forget to update this if it changes in the future, so you can just look at the code)

```ts
private parseRequestBody(body: any) {
    let parsedBody: FormData | string | undefined = undefined;

    if (body instanceof FormData || typeof body === "string") {
        parsedBody = body;
    } else {
        parsedBody = JSON.stringify(body);
    }

    return parsedBody;
}
```

## Checking for errors

If the `response.ok === false` `Gauk` will throw the exact response it would give you if it would have succeeded

## Response type

The response type is exactly the same as the fetch, but there is an extra property `data` that has parsed response

```ts
export type IResponse<T> = {
    data: T | undefined;
} & Response;
```

## API

```ts
class Gauk {
    constructor({ options, beforeRequest }?: Init);
    get<T>(url: string, optionsUser?: OptionsUser): Promise<IResponse<T>>;
    del<T>(url: string, optionsUser?: OptionsUser): Promise<IResponse<T>>;
    post<T>(url: string, body: any, optionsUser?: OptionsUser): Promise<IResponse<T>>;
    put<T>(url: string, body: any, optionsUser?: OptionsUser): Promise<IResponse<T>>;
}
```
