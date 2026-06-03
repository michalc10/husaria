import { Component, OnInit } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { OfflineMutation } from '../offline.types';
import { OfflineSyncService } from '../offline-sync.service';

@Component({
  selector: 'app-sync-conflicts',
  templateUrl: './sync-conflicts.component.html',
  styleUrls: ['./sync-conflicts.component.scss'],
  standalone: false
})
export class SyncConflictsComponent implements OnInit {
  conflicts: OfflineMutation[] = [];
  loading = true;

  constructor(
    private offlineSync: OfflineSyncService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.offlineSync.conflicts().subscribe(conflicts => {
      this.conflicts = conflicts;
      this.loading = false;
    });
  }

  message(conflict: OfflineMutation): string {
    return (conflict.conflict as any)?.message || conflict.lastError || this.transloco.translate('offline.conflict');
  }

  entityLabel(conflict: OfflineMutation): string {
    return (conflict.conflict as any)?.entityLabel || conflict.entityId || conflict.type;
  }

  reason(conflict: OfflineMutation): string {
    return (conflict.conflict as any)?.reason || 'CONFLICT';
  }

  localValue(conflict: OfflineMutation): string {
    return this.formatValue((conflict.conflict as any)?.client || conflict.payload);
  }

  serverValue(conflict: OfflineMutation): string {
    return this.formatValue((conflict.conflict as any)?.server || (conflict.conflict as any)?.liveState || {});
  }

  retry(conflict: OfflineMutation): void {
    this.offlineSync.retryConflict(conflict).subscribe(() => this.load());
  }

  discard(conflict: OfflineMutation): void {
    this.offlineSync.discardConflict(conflict.clientMutationId).subscribe(() => this.load());
  }

  private formatValue(value: unknown): string {
    if (!value || (typeof value === 'object' && !Object.keys(value as Record<string, unknown>).length)) {
      return this.transloco.translate('common.dash');
    }

    return JSON.stringify(this.redactValue(value), null, 2);
  }

  private redactValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(item => this.redactValue(item));
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
      if (['token', 'authorization', 'password'].includes(key.toLowerCase())) {
        result[key] = '[redacted]';
        return result;
      }

      result[key] = this.redactValue(item);
      return result;
    }, {});
  }
}
