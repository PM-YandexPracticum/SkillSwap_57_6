import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch } from '../../../store'; // путь к типу dispatch
import type { RootState } from '../../../store';
import type {  RequestNotification, RequestsSnapshot } from './types';
import type {  SwapRequest } from '../../../shared/types';
import { readRequestsSnapshot } from './requestsStorage';

interface RequestsState {
  snapshot: RequestsSnapshot;
  readError: Error | null;
  operationError: Error | null;
}

const initialState: RequestsState = {
  snapshot: { version: 1, requests: [], notifications: [] },
  readError: null,
  operationError: null,
};

const requestsSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    setSnapshot: (state, action: PayloadAction<RequestsSnapshot>) => {
      state.snapshot = action.payload;
      state.readError = null;
    },
    addRequest: (state, action: PayloadAction<SwapRequest>) => {
      const exists = state.snapshot.requests.some(r => r.id === action.payload.id);
      if (!exists) {
        state.snapshot.requests.push(action.payload);
      }
    },
    updateRequest: (
      state,
      action: PayloadAction<Partial<SwapRequest> & { id: string }>
    ) => {
      const req = state.snapshot.requests.find(r => r.id === action.payload.id);
      if (req) {
        Object.assign(req, action.payload);
      }
    },
    addNotification: (state, action: PayloadAction<RequestNotification>) => {
      const exists = state.snapshot.notifications.some(
        n => n.id === action.payload.id
      );
      if (!exists) {
        state.snapshot.notifications.push(action.payload);
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const n = state.snapshot.notifications.find(
        n => n.id === action.payload
      );
      if (n) {
        n.read = true;
      }
    },
    clear: (state) => {
      state.snapshot = { version: 1, requests: [], notifications: [] };
      state.operationError = null;
    },
    setOperationError: (state, action: PayloadAction<Error | null>) => {
      state.operationError = action.payload;
    },
  },
});

// Thunk восстановления
export const restoreRequests = async (dispatch: AppDispatch): Promise<boolean> => {
  try {
    const snapshot = readRequestsSnapshot();
    // Здесь можно добавить дополнительную валидацию snapshot (уникальные ID, fromUserId≠toUserId и т.п.)
    dispatch(setSnapshot(snapshot));
    return true;
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    // Не очищаем данные при ошибке чтения
    dispatch(setOperationError(error));
    return false;
  }
};

// Селекторы
export const selectRequestsSnapshot = (state: RootState) =>
  state.requests.snapshot;

export const selectIncomingRequests = (
  state: RootState,
  userId: string
): SwapRequest[] =>
  state.requests.snapshot.requests.filter(
    r => r.toUserId === userId && r.status !== 'done'
  );

export const selectOutgoingRequests = (
  state: RootState,
  userId: string
): SwapRequest[] =>
  state.requests.snapshot.requests.filter(
    r => r.fromUserId === userId && r.status !== 'done'
  );

export const selectActiveRequestForSkill = (
  state: RootState,
  userId: string,
  skillId: string
): SwapRequest | undefined =>
  state.requests.snapshot.requests.find(
    r =>
      (r.fromUserId === userId || r.toUserId === userId) &&
      r.skillId === skillId &&
      r.status !== 'done'
  );

export const selectUnreadNotifications = (
  state: RootState,
  userId: string
): RequestNotification[] =>
  state.requests.snapshot.notifications.filter(
    n => n.userId === userId && !n.read
  );

export const {
  setSnapshot,
  addRequest,
  updateRequest,
  addNotification,
  markNotificationRead,
  clear,
  setOperationError,
} = requestsSlice.actions;

export default requestsSlice.reducer;
