export type OfflineMutationStatus = 'pending' | 'syncing' | 'applied' | 'conflict' | 'failed';

export interface OfflineMutation<TPayload = unknown> {
  clientMutationId: string;
  type: 'battleResult.update' | 'judgeSessionResult.update' | string;
  entityId: string;
  tournamentId?: string;
  baseRevision?: number | null;
  authMode?: 'session' | 'judge';
  tokenFingerprint?: string;
  payload: TPayload;
  createdAt: string;
  deviceId: string;
  status: OfflineMutationStatus;
  lastError?: string;
  result?: unknown;
  conflict?: unknown;
}

export interface OfflineSnapshot<TData = unknown> {
  key: string;
  tournamentId?: string;
  data: TData;
  updatedAt: string;
}

export interface SyncMutationResponseItem<T = unknown> {
  clientMutationId: string;
  type: string;
  entityId: string;
  status: 'APPLIED' | 'CONFLICT' | 'FAILED';
  result?: T;
  conflict?: unknown;
}

export interface SyncMutationsResponse<T = unknown> {
  applied: SyncMutationResponseItem<T>[];
  conflicts: SyncMutationResponseItem[];
  failed: SyncMutationResponseItem[];
  serverSnapshotVersion: string;
}

export interface OfflineMutationOutcome<T = unknown> {
  status: 'applied' | 'queued' | 'conflict' | 'failed';
  result?: T;
  mutation: OfflineMutation;
  message?: string;
}
