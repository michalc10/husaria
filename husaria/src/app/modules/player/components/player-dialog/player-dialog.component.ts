import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPlayer } from 'src/app/models/player';

@Component({
  selector: 'app-player-dialog',
  templateUrl: './player-dialog.component.html',
  styleUrls: ['./player-dialog.component.scss']
})
export class PlayerDialogComponent {
  @Input() display = false;

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

  header = 'Dodaj husarza';
  buttonText = 'Dodaj';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      horse: ['', Validators.required],
      flag: ['']
    });
  }

  private patchForm(p: IPlayer | null) {
    this.form.reset({
      name: p?.name ?? '',
      horse: p?.horse ?? '',
      flag: p?.flag ?? ''
    }, { emitEvent: false });
  }

  private updateUiTexts(p: IPlayer | null) {
    const isEdit = !!p && !!p._id && p._id !== '-1';
    this.header = isEdit ? 'Edytuj husarza' : 'Dodaj husarza';
    this.buttonText = isEdit ? 'Zapisz' : 'Dodaj';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, horse, flag } = this.form.getRawValue();

    // Zachowujemy _id z wejścia (również sentinel '-1' dla CREATE)
    const id = this.player?._id ?? '-1';

    const payload: IPlayer = {
      _id: id,
      name,
      horse,
      flag
    };

    this.comunication.emit(payload);
  }

  closingWithoutSaving(): void {
    this.comunicationWithoutSaving.emit(true);
  }

  isInvalid(ctrl: string): boolean {
  const c = this.form.get(ctrl);
  return !!c && c.invalid && (c.dirty || c.touched);
}
}