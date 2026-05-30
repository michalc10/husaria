import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { IBanner } from 'src/app/models/banner';

@Component({
  selector: 'app-banner-dialog',
  templateUrl: './banner-dialog.component.html',
  styleUrls: ['./banner-dialog.component.scss'],
  standalone: false
})
export class BannerDialogComponent {
  @Input() display = false;

  private _banner: IBanner | null = null;
  @Input() set banner(value: IBanner | null) {
    this._banner = value;
    this.patchForm(value);
    this.updateUiTexts(value);
  }
  get banner(): IBanner | null {
    return this._banner;
  }

  @Output() saved = new EventEmitter<IBanner>();
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  header = '';
  buttonText = '';
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private transloco: TranslocoService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      city: ['']
    });
    this.updateUiTexts(null);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, city } = this.form.getRawValue();
    this.saved.emit({
      _id: this.banner?._id ?? '-1',
      name,
      city: city || ''
    });
  }

  close(): void {
    this.submitted = false;
    this.closed.emit();
  }

  isInvalid(ctrl: string): boolean {
    const control = this.form.get(ctrl);
    return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
  }

  private patchForm(banner: IBanner | null): void {
    this.submitted = false;
    this.form.reset({
      name: banner?.name ?? '',
      city: banner?.city ?? ''
    }, { emitEvent: false });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private updateUiTexts(banner: IBanner | null): void {
    const isEdit = !!banner && !!banner._id && banner._id !== '-1';
    this.header = this.transloco.translate(isEdit ? 'banner.edit' : 'banner.add');
    this.buttonText = this.transloco.translate(isEdit ? 'common.save' : 'common.add');
  }
}
