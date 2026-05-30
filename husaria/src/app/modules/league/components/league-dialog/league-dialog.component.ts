import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { ILeague } from 'src/app/models/league';
import { ITournament } from 'src/app/models/tournament';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-league-dialog',
  templateUrl: './league-dialog.component.html',
  styleUrls: ['./league-dialog.component.scss'],
  standalone: false
})
export class LeagueDialogComponent {
  @Input() display = false;

  private _league!: ILeague;
  @Input() set league(value: ILeague) {
    this._league = value;
    this.patchForm(value);
    this.updateUiTexts(value);

    if (value?._id && value._id !== '-1') {
      this.loadTournaments(value._id);
    } else {
      this.tournamentList = [];
    }
  }
  get league(): ILeague {
    return this._league;
  }

  @Output() comunication = new EventEmitter<ILeague>();
  @Output() comunicationWithoutSaving = new EventEmitter<boolean>();

  leagueForm: FormGroup;
  headerKey = 'league.add';
  buttonTextKey = 'common.create';
  submitted = false;
  tournamentList: Array<Partial<ITournament>> = [];
  private submittedSuccessfully = false;

  constructor(
    private fb: FormBuilder,
    private crudService: CrudService,
    private transloco: TranslocoService
  ) {
    this.leagueForm = this.fb.group({
      name: ['', Validators.required],
      year: ['', Validators.required]
    });
  }

  addTournamentRow(): void {
    const leagueId = this._league?._id && this._league._id !== '-1'
      ? this._league._id
      : undefined;

    this.tournamentList = [
      ...this.tournamentList,
      { leagueId, city: '', date: new Date() }
    ];
  }

  removeTournamentRow(index: number): void {
    const row = this.tournamentList[index];
    if (row?._id) return;

    this.tournamentList = this.tournamentList.filter((_, rowIndex) => rowIndex !== index);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.leagueForm.invalid) {
      this.leagueForm.markAllAsTouched();
      return;
    }

    const { name, year } = this.leagueForm.getRawValue();
    this._league = {
      ...this._league,
      name,
      year
    };

    const tournamentPayloads = this.tournamentList.map((t) => this.toTournamentPayload(t));

    this.submittedSuccessfully = true;
    this.comunication.emit({
      ...this._league,
      tournaments: tournamentPayloads
    });
  }

  closingWithoutSaving(): void {
    this.submitted = false;
    if (this.submittedSuccessfully) {
      this.submittedSuccessfully = false;
      return;
    }

    this.comunicationWithoutSaving.emit(true);
  }

  isInvalid(ctrl: string): boolean {
    const control = this.leagueForm.get(ctrl);
    return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
  }

  canRemoveTournament(row: Partial<ITournament>): boolean {
    return !row._id;
  }

  trackTournament(index: number, tournament: Partial<ITournament>): string {
    return tournament._id || `new-${index}`;
  }

  private toTournamentPayload(tournament: Partial<ITournament>): Partial<ITournament> {
    return {
      _id: tournament._id,
      city: tournament.city || '',
      date: tournament.date instanceof Date
        ? tournament.date
        : new Date((tournament as any).date || Date.now())
    };
  }

  private loadTournaments(leagueId: string): void {
    this.crudService.read<ITournament[]>('tournament/league', leagueId).subscribe({
      next: (list) => {
        this.tournamentList = list.map(t => ({
          ...t,
          date: t.date instanceof Date ? t.date : new Date((t as any).date)
        }));
      },
      error: (err) => console.error(this.transloco.translate('league.loadTournamentsError'), err)
    });
  }

  private patchForm(league: ILeague): void {
    this.submitted = false;
    this.leagueForm.reset({
      name: league?.name ?? '',
      year: league?.year ?? ''
    }, { emitEvent: false });
    this.leagueForm.markAsPristine();
    this.leagueForm.markAsUntouched();
  }

  private updateUiTexts(league: ILeague): void {
    const isEdit = !!league?._id && league._id !== '-1';
    this.headerKey = isEdit ? 'league.edit' : 'league.add';
    this.buttonTextKey = isEdit ? 'common.save' : 'common.create';
  }
}
