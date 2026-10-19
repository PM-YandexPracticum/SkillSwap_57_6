import { LOCAL_STORAGE_KEYS } from '../../../shared/lib/constants'
import type { RequestsSnapshot } from './types';

const KEY = LOCAL_STORAGE_KEYS.REQUESTS;

export const readRequestsSnapshot = (): RequestsSnapshot => {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    return { version: 1, requests: [], notifications: [] };
  }
  try {
    const parsed = JSON.parse(raw) as RequestsSnapshot;
    if (parsed.version !== 1) {
      throw new Error('Invalid snapshot version');
    }
    if (!Array.isArray(parsed.requests) || !Array.isArray(parsed.notifications)) {
      throw new Error('Snapshot structure is invalid');
    }
    return parsed;
  } catch (e) {
    throw new Error(`Failed to read requests snapshot: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const writeRequestsSnapshot = (snapshot: RequestsSnapshot): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch (e) {
    throw new Error(`Failed to write requests snapshot: ${e instanceof Error ? e.message : String(e)}`);
  }
};
