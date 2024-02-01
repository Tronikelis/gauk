import urlbat from "urlbat";

export type IResponseType = "blob" | "json" | "text";

export type Options = {
    responseType?: IResponseType;
    baseUrl?: string;
} & {
    headers?: Headers;
} & Omit<RequestInit, "headers">;

export type OptionsUser = Omit<Options, "headers" | "body"> & {
    headers?: HeadersInit;
};

export type IResponse<T> = {
    data: T | undefined;
} & Response;

export type BeforeRequestFn = (options: Options) => Promise<void>;

export type Init = {
    options?: OptionsUser;
    beforeRequest?: BeforeRequestFn[];
};

export default class Gauk {
    private options: Options | undefined;
    private beforeRequest: BeforeRequestFn[];

    constructor({ options, beforeRequest = [] }: Init = {}) {
        this.options = this.combineOptions(options);
        this.beforeRequest = beforeRequest;
    }

    private concat(a: string, b: string): string {
        return urlbat(a, b);
    }

    private combineHeaders(a?: HeadersInit, b?: HeadersInit): Headers {
        const aH = new Headers(a);
        const bH = new Headers(b);

        for (const [key, value] of bH.entries()) {
            aH.set(key, value);
        }

        return aH;
    }

    private combineOptions(a?: Options | OptionsUser, b?: Options | OptionsUser): Options {
        return {
            ...a,
            ...b,
            headers: this.combineHeaders(a?.headers, b?.headers),
        };
    }

    private async parseResponseData<T>(
        response: Response,
        responseType: IResponseType = "json"
    ): Promise<T | undefined> {
        try {
            switch (responseType) {
                case "json":
                    return (await response.json()) as T;
                case "blob":
                    return (await response.blob()) as T;
                default:
                    return (await response.text()) as T;
            }
        } catch {
            /* empty */
        }

        return undefined;
    }

    private parseRequestBody(body: any) {
        let parsedBody: FormData | string | undefined = undefined;

        if (body instanceof FormData) {
            parsedBody = body;
        } else if (body) {
            parsedBody = JSON.stringify(body);
        }

        return parsedBody;
    }

    private async prepareOptions(optionsUser?: OptionsUser): Promise<Options> {
        const combinedOptions = this.combineOptions(this.options, optionsUser);

        for (const beforeRequest of this.beforeRequest) {
            await beforeRequest(combinedOptions);
        }

        return combinedOptions;
    }

    private async createRequest<T>(
        url: string,
        optionsUser?: OptionsUser,
        optionsOverride?: Options
    ): Promise<IResponse<T>> {
        let options = this.combineOptions(optionsUser, optionsOverride);
        options = await this.prepareOptions(options);

        const response = await fetch(this.concat(options.baseUrl || "", url), options);

        const data = await this.parseResponseData<T>(response, options.responseType);

        const combined = {
            ...response.clone(),
            data,
        };

        if (!response.ok) {
            throw combined;
        }

        return combined;
    }

    async get<T>(url: string, optionsUser?: OptionsUser) {
        return await this.createRequest<T>(url, optionsUser, { method: "GET" });
    }

    async del<T>(url: string, optionsUser?: OptionsUser) {
        return await this.createRequest<T>(url, optionsUser, {
            method: "DELETE",
        });
    }

    async post<T>(url: string, body: any, optionsUser?: OptionsUser) {
        return await this.createRequest<T>(url, optionsUser, {
            method: "POST",
            body: this.parseRequestBody(body),
        });
    }

    async put<T>(url: string, body: any, optionsUser?: OptionsUser) {
        return await this.createRequest<T>(url, optionsUser, {
            method: "PUT",
            body: this.parseRequestBody(body),
        });
    }
}
