import axios from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

interface PendingRequest {
  controller: AbortController;
  url: string | undefined;
}

/** In-flight requests keyed for cooperative cancellation. */
const pendingRequests: PendingRequest[] = [];

/** Standard JSON envelope returned by the backend. */
export interface ApiEnvelope<T = unknown> {
  code: number;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

const request = axios.create({
  baseURL: "/",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    config.signal = controller.signal;
    pendingRequests.push({ controller, url: config.url });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope>) => {
    const body = response.data;
    const config = response.config as InternalAxiosRequestConfig & {
      returnedDirectly?: boolean;
    };

    const index = pendingRequests.findIndex((item) => item.url === config.url);
    if (index > -1) {
      pendingRequests.splice(index, 1);
    }

    if (config.returnedDirectly) {
      return response;
    }

    const allowedBusinessCodes = [200, 201];
    if (!allowedBusinessCodes.includes(body.code)) {
      return Promise.reject(new Error(body.message ?? "Unknown error"));
    }

    return response;
  },
  (error) => {
    if (error.config) {
      const index = pendingRequests.findIndex(
        (item) => item.url === error.config.url,
      );
      if (index > -1) {
        pendingRequests.splice(index, 1);
      }
    }
    return Promise.reject(error);
  },
);

export const abortAllRequests = (): void => {
  pendingRequests.forEach(({ controller }) => {
    controller.abort();
  });
  pendingRequests.length = 0;
};

/** Abort pending requests whose URL contains the given substring. */
export const abortRequestsByUrl = (urlPattern: string): void => {
  const toAbort = pendingRequests.filter((item) =>
    item.url?.includes(urlPattern),
  );
  toAbort.forEach(({ controller, url }) => {
    controller.abort();
    const index = pendingRequests.findIndex((item) => item.url === url);
    if (index > -1) {
      pendingRequests.splice(index, 1);
    }
  });
};

export default request;
