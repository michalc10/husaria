import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { Table } from 'primeng/table';
import { IBanner } from 'src/app/models/banner';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-banner-list',
  templateUrl: './banner-list.component.html',
  styleUrls: ['./banner-list.component.scss'],
  standalone: false
})
export class BannerListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  readonly bannerRoute = 'banner';

  bannerList: IBanner[] = [];
  selectedBanner: IBanner = { _id: '-1', name: '', city: '' };
  display = false;
  errorMessage = '';

  constructor(
    private crudService: CrudService,
    private confirmationService: ConfirmationService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.loadBanners();
  }

  loadBanners(): void {
    this.crudService.list<IBanner>(this.bannerRoute).subscribe({
      next: (banners) => {
        this.bannerList = banners;
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = this.transloco.translate('banner.loadError');
        console.error(this.errorMessage, err);
      }
    });
  }

  onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dt.filterGlobal(value, 'contains');
  }

  createBanner(): void {
    this.selectedBanner = { _id: '-1', name: '', city: '' };
    this.display = true;
  }

  editBanner(banner: IBanner): void {
    this.selectedBanner = { ...banner };
    this.display = true;
  }

  closeDialog(): void {
    this.display = false;
  }

  saveBanner(banner: IBanner): void {
    this.display = false;
    this.errorMessage = '';

    if (banner._id === '-1') {
      const { _id, ...payload } = banner;
      this.crudService.create<IBanner>(this.bannerRoute, payload).subscribe({
        next: () => this.loadBanners(),
        error: (err) => this.handleSaveError(err)
      });
      return;
    }

    this.crudService.update<IBanner>(this.bannerRoute, banner._id!, banner).subscribe({
      next: () => this.loadBanners(),
      error: (err) => this.handleSaveError(err)
    });
  }

  confirmDelete(event: Event, banner: IBanner): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.transloco.translate('banner.deleteConfirm', { name: banner.name }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.transloco.translate('common.yes'),
      rejectLabel: this.transloco.translate('common.no'),
      accept: () => {
        this.crudService.delete(this.bannerRoute, banner._id!).subscribe({
          next: () => this.loadBanners(),
          error: (err) => {
            this.errorMessage = this.transloco.translate('banner.deleteError');
            console.error(this.errorMessage, err);
          }
        });
      }
    });
  }

  private handleSaveError(err: unknown): void {
    this.errorMessage = this.transloco.translate('banner.saveError');
    console.error(this.errorMessage, err);
  }
}
