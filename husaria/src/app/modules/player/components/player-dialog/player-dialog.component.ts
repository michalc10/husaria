import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { IBanner } from 'src/app/models/banner';
import { IPlayer } from 'src/app/models/player';

@Component({
  selector: 'app-player-dialog',
  templateUrl: './player-dialog.component.html',
  styleUrls: ['./player-dialog.component.scss'],
  standalone: false
})
export class PlayerDialogComponent {
  @Input() display = false;
  @Input() banners: IBanner[] = [];

  private _player: IPlayer | null = null;
  @Input() set player(value: IPlayer | null) {
    this._player = value;
    this.patchForm(value);
    this.updateUiTexts(value);
  }
  get player(): IPlayer | null {
    return this._player;
  }

  @Output() comunication = new EventEmitter<IPlayer>();
  @Output() comunicationWithoutSaving = new EventEmitter<boolean>();

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
      horse: ['', Validators.required],
      bannerId: ['', Validators.required]
    });
    this.updateUiTexts(null);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, horse, bannerId } = this.form.getRawValue();

    this.comunication.emit({
      _id: this.player?._id ?? '-1',
      name,
      horse,
      bannerId: bannerId || null,
      flag: this.player?.flag
    });
  }

  closingWithoutSaving(): void {
    this.submitted = false;
    this.comunicationWithoutSaving.emit(true);
  }

  isInvalid(ctrl: string): boolean {
    const control = this.form.get(ctrl);
    return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
  }

  bannerLabel(banner: IBanner): string {
    return banner.city ? `${banner.name} (${banner.city})` : banner.name;
  }

  private patchForm(player: IPlayer | null): void {
    this.submitted = false;
    this.syncBannerValidation(player);
    this.form.reset({
      name: player?.name ?? '',
      horse: player?.horse ?? '',
      bannerId: player?.bannerId ?? ''
    }, { emitEvent: false });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private updateUiTexts(player: IPlayer | null): void {
    const isEdit = !!player && !!player._id && player._id !== '-1';
    this.header = this.transloco.translate(isEdit ? 'player.edit' : 'player.add');
    this.buttonText = this.transloco.translate(isEdit ? 'common.save' : 'common.add');
  }

  private syncBannerValidation(player: IPlayer | null): void {
    const bannerControl = this.form.get('bannerId');
    if (!bannerControl) return;

    const isEdit = !!player && !!player._id && player._id !== '-1';
    if (isEdit) {
      bannerControl.clearValidators();
    } else {
      bannerControl.setValidators(Validators.required);
    }
    bannerControl.updateValueAndValidity({ emitEvent: false });
  }
}
