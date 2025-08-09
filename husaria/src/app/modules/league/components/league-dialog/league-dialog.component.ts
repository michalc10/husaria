import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ILeague } from 'src/app/models/league';
import { ITournament } from 'src/app/models/tournament';
import { CrudService } from 'src/app/shered/service/crud.service';
import { TournamentService } from 'src/app/modules/turnament/services/tournament/tournament.service';

@Component({
  selector: 'app-league-dialog',
  templateUrl: './league-dialog.component.html',
  styleUrls: ['./league-dialog.component.scss']
})
export class LeagueDialogComponent {
  @Input() display = false;

  private _league!: ILeague;
  @Input() set league(value: ILeague) {
    this._league = value;
    this.patchForm(value);
    this.updateButtonText(value);

    if (value?._id && value._id !== '-1') {
      this.loadTournaments(value._id);
    } else {
      this.tournamentList = [];
    }
  }
  get league(): ILeague { return this._league; }

  @Output() comunication = new EventEmitter<ILeague>();
  @Output() comunicationWithoutSaving = new EventEmitter<boolean>();

  leagueForm: FormGroup;
  buttonText = 'Stwórz';

  // pozwala dodawać nowe (bez _id)
  tournamentList: Array<Partial<ITournament>> = [];

  constructor(
    private fb: FormBuilder,
    private crudService: CrudService,
    private tournamentService: TournamentService
  ) {
    this.leagueForm = this.fb.group({
      name: ['', Validators.required],
      year: ['', Validators.required]
    });
  }

  private loadTournaments(leagueId: string): void {
    this.crudService.read<ITournament[]>('tournament/league', leagueId).subscribe({
      next: (list) => {
        const normalized = list.map(t => ({
          ...t,
          date: t.date instanceof Date ? t.date : new Date((t as any).date)
        })) as ITournament[];
        this.tournamentList = normalized;
      },
      error: (err) => console.error('Błąd pobierania turniejów', err)
    });
  }

  addTournamentRow(): void {
    if (!this._league?._id || this._league._id === '-1') {
      // nowa liga – pozwalamy dodać wiersze, ale leagueId wypełnimy po utworzeniu ligi (po stronie rodzica)
      this.tournamentList = [
        ...this.tournamentList,
        { city: '', date: new Date() }
      ];
    } else {
      this.tournamentList = [
        ...this.tournamentList,
        { leagueId: this._league._id, city: '', date: new Date() }
      ];
    }
  }

  private patchForm(league: ILeague): void {
    this.leagueForm.reset({
      name: league?.name ?? '',
      year: league?.year ?? ''
    }, { emitEvent: false });
  }

  private updateButtonText(league: ILeague): void {
    const isEdit = !!league?._id && league._id !== '-1';
    this.buttonText = isEdit ? 'Zapisz' : 'Stwórz';
  }

  onSubmit(): void {
    if (this.leagueForm.invalid) {
      this.leagueForm.markAllAsTouched();
      return;
    }

    const { name, year } = this.leagueForm.getRawValue();
    this._league.name = name;
    this._league.year = year;

    // 1) aktualizacje istniejących
    const updates = this.tournamentList
      .filter(t => !!t._id)
      .map(t => {
        const payload: Partial<ITournament> = {
          city: t.city,
          date: t.date instanceof Date ? t.date.toISOString() : (t.date as any),
        };
        return this.tournamentService.update(t._id as string, payload);
      });

    // 2) tworzenie nowych
    const creates = this.tournamentList
      .filter(t => !t._id)
      .map(t => {
        const payload: Partial<ITournament> = {
          leagueId: this._league._id, // jeśli liga jest nowa, rodzic powinien utworzyć ligę, a potem turnieje
          city: t.city,
          date: t.date instanceof Date ? t.date.toISOString() : (t.date as any),
        };
        return this.tournamentService.create(payload);
      });

    if (updates.length || creates.length) {
      forkJoin([...updates, ...creates]).subscribe({
        next: () => this.comunication.emit(this._league),
        error: (err) => {
          console.error('Błąd zapisu turniejów', err);
          // mimo błędu ligi nie emitujemy, zostawiamy w dialogu
        }
      });
    } else {
      this.comunication.emit(this._league);
    }
  }

  closingWithoutSaving(): void {
    this.comunicationWithoutSaving.emit(true);
  }
}