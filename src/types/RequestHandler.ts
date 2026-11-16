export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
    method: HttpMethod;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    omitCookies?: boolean;
    rawHeaders?: boolean;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;
