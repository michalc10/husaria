import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OfflineSyncService } from '../offline-sync.service';

@Component({
  selector: 'app-offline-status',
  templateUrl: './offline-status.component.html',
  styleUrls: ['./offline-status.component.scss'],
  standalone: false
})
export class OfflineStatusComponent {
  readonly online$ = this.offlineSync.online$;
  readonly pendingCount$ = this.offlineSync.pendingCount$;
  readonly conflictCount$ = this.offlineSync.conflictCount$;

  constructor(
    private offlineSync: OfflineSyncService,
    private router: Router
  ) {}

  syncNow(): void {
    this.offlineSync.syncPending();
  }

  openConflicts(): void {
    this.router.navigate(['/sync/conflicts']);
  }
}
