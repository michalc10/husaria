import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable, EMPTY, merge } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { ITournament } from 'src/app/models/tournament';
import { TournamentService } from '../services/tournament/tournament.service';

interface SelectOption {
  label: string;
  value: number;
  path: string;
}

@Component({
  selector: 'app-tournament-layout',
  templateUrl: './tournament-layout.component.html',
  styleUrls: ['./tournament-layout.component.scss']
})
export class TournamentLayoutComponent {
  // wyciągamy id z aktualnej trasy lub rodzica (obsługa różnych konfiguracji)
  readonly tournamentId$: Observable<string> = merge(
    this.route.paramMap,
    this.route.parent ? this.route.parent.paramMap : EMPTY
  ).pipe(
    map(pm => pm.get('idTournament') ?? pm.get('id')), // <-- kluczowa zmiana
    filter((id): id is string => !!id),
    distinctUntilChanged(),
    shareReplay(1)
  );

  readonly tournament$: Observable<ITournament> = this.tournamentId$.pipe(
    switchMap(id => this.tournamentService.get(id)),
    map(t => ({ ...t, date: t.date instanceof Date ? t.date : new Date((t as any).date) })),
    catchError(err => {
      console.error('Nie udało się pobrać turnieju', err);
      return EMPTY;
    }),
    shareReplay(1)
  );

  readonly options$: Observable<SelectOption[]> = this.tournament$.pipe(
    map(t => this.buildOptions(t)),
    shareReplay(1)
  );

  readonly selectedOption$: Observable<number> = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    startWith(new NavigationEnd(0, this.router.url, this.router.url)),
    map(e => this.mapUrlToValue(e.urlAfterRedirects || e.url)),
    distinctUntilChanged(),
    shareReplay(1)
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tournamentService: TournamentService
  ) {}

  onOptionChange(val: number): void {
    const path = this.valueToPath(val);
    this.router.navigate([path], { relativeTo: this.route });
  }

  private buildOptions(t: ITournament): SelectOption[] {
    const opts: SelectOption[] = [
      { label: 'Zawodnicy', value: 1, path: 'participant' },
      { label: 'Konkurencje', value: 2, path: 'competition' }
    ];

    const battles: Array<keyof ITournament> = ['battle_1', 'battle_2', 'battle_3', 'battle_4', 'battle_5'];
    battles.forEach((key, idx) => {
      const raw = t[key] as unknown as string | undefined;
      if (raw) {
        const name = this.getBattleName(raw);
        opts.push({
          label: `${idx + 1}. ${name}`,
          value: idx + 3,
          path: `battle/${idx + 1}`
        });
      }
    });

    opts.push({ label: 'Wyniki', value: 8, path: 'result' });
    return opts;
  }

  private getBattleName(battleString: string): string {
    const [battleName] = (battleString || '').split(';');
    return battleName?.trim() || 'Bitwa';
  }

  private mapUrlToValue(url: string): number {
    const battleMatch = url.match(/\/battle\/(\d+)/);
    if (battleMatch) return Number(battleMatch[1]) + 2;
    if (url.includes('/competition')) return 2;
    if (url.includes('/result')) return 8;
    return 1;
  }

  private valueToPath(val: number): string {
    if (val >= 3 && val <= 7) return `battle/${val - 2}`;
    if (val === 8) return 'result';
    if (val === 2) return 'competition';
    return 'participant';
  }
}