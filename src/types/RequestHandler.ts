export interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path?: string;
    body?: unknown;
    headers?: Record<string, string>;
}