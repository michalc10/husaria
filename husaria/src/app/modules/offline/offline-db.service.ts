import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { OfflineMutation, OfflineMutationStatus, OfflineSnapshot } from './offline.types';

class HusariaOfflineDatabase extends Dexie {
  mutations!: Table<OfflineMutation, string>;
  snapshots!: Table<OfflineSnapshot, string>;

  constructor() {
    super('husaria-offline');
    this.version(1).stores({
      mutations: 'clientMutationId, status, tournamentId, createdAt, deviceId',
      snapshots: 'key, tournamentId, updatedAt'
    });
  }
}

@Injectable({ providedIn: 'root' })
export class OfflineDbService {
  private readonly db = new HusariaOfflineDatabase();

  putMutation(mutation: OfflineMutation): Promise<string> {
    return this.db.mutations.put(mutation);
  }

  updateMutation(clientMutationId: string, patch: Partial<OfflineMutation>): Promise<number> {
    return this.db.mutations.update(clientMutationId, patch);
  }

  pendingMutations(): Promise<OfflineMutation[]> {
    return this.db.mutations
      .where('status')
      .anyOf(['pending', 'syncing'])
      .sortBy('createdAt');
  }

  mutationsByStatus(statuses: OfflineMutationStatus[]): Promise<OfflineMutation[]> {
    return this.db.mutations.where('status').anyOf(statuses).reverse().sortBy('createdAt');
  }

  countByStatus(statuses: OfflineMutationStatus[]): Promise<number> {
    return this.db.mutations.where('status').anyOf(statuses).count();
  }

  deleteMutation(clientMutationId: string): Promise<void> {
    return this.db.mutations.delete(clientMutationId);
  }

  putSnapshot(snapshot: OfflineSnapshot): Promise<string> {
    return this.db.snapshots.put(snapshot);
  }

  getSnapshot<T = unknown>(key: string): Promise<OfflineSnapshot<T> | undefined> {
    return this.db.snapshots.get(key) as Promise<OfflineSnapshot<T> | undefined>;
  }
}
