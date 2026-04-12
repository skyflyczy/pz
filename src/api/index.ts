/**
 * HTTP API surface. Adjust {@link API_PREFIX} and path segments here to match your backend.
 */
import request from "@/utils/request";
import type { ApiEnvelope } from "@/utils/request";

const API_PREFIX = "/api";

export interface SetChatPayload {
  address: string;
  msg: string | null;
  flag: string;
  chatTime: string;
}

export interface SetChatData {
  content?: string;
  modelResult?: string;
}

export async function setChat(
  payload: SetChatPayload,
): Promise<ApiEnvelope<SetChatData>> {
  const res = await request.post<ApiEnvelope<SetChatData>>(
    `${API_PREFIX}/chat/send`,
    payload,
  );
  return res.data;
}

export interface ChatLimitPayload {
  address: string | undefined;
  chatTime: string;
}

/** Returns `data === 1` when the user may continue chatting. */
export async function apiChatLimit(
  payload: ChatLimitPayload,
): Promise<ApiEnvelope<number>> {
  const res = await request.post<ApiEnvelope<number>>(
    `${API_PREFIX}/chat/limit`,
    payload,
  );
  return res.data;
}

export async function getAllTxid(
  address: string | undefined,
): Promise<ApiEnvelope<string[]>> {
  const res = await request.get<ApiEnvelope<string[]>>(
    `${API_PREFIX}/chat/txids`,
    { params: { address } },
  );
  return res.data;
}

export interface SaveTxPayload {
  address: string | undefined;
  arTxId: string;
  modelResult?: string;
  gas?: string | number;
  uploadSize?: number;
  createTime: string;
}

export async function saveTx(payload: SaveTxPayload): Promise<ApiEnvelope<unknown>> {
  const res = await request.post<ApiEnvelope<unknown>>(
    `${API_PREFIX}/transaction/save`,
    payload,
  );
  return res.data;
}

export interface TableListQuery {
  arTxId: string;
  current: number;
  size: number;
  address: string | undefined;
}

export interface TableListPayload {
  pages: number;
  list: Array<{
    arTxId: string;
    time: string;
    size: string;
    gas: string;
    bonus?: string;
    status: string;
  }>;
}

export async function getTableList(
  query: TableListQuery,
): Promise<ApiEnvelope<TableListPayload>> {
  const res = await request.get<ApiEnvelope<TableListPayload>>(
    `${API_PREFIX}/records/list`,
    { params: query },
  );
  return res.data;
}

export async function getTotalRevenue(
  address: string | undefined,
): Promise<ApiEnvelope<number>> {
  const res = await request.get<ApiEnvelope<number>>(
    `${API_PREFIX}/records/revenue`,
    { params: { address } },
  );
  return res.data;
}

export async function apiGetTaskStatus(
  arTxId: string,
): Promise<ApiEnvelope<string>> {
  const res = await request.get<ApiEnvelope<string>>(
    `${API_PREFIX}/records/task-status`,
    { params: { arTxId } },
  );
  return res.data;
}
