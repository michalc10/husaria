import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import Lara from '@primeuix/themes/lara';
import { ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { of } from 'rxjs';
import pl from '../../assets/i18n/pl.json';

const routeParams = {
  idTournament: 'test-tournament-id',
  battleId: 'test-battle-id',
};

const paramMap = convertToParamMap(routeParams);

export const TEST_IMPORTS = [
  RouterTestingModule,
  NoopAnimationsModule,
  TranslocoTestingModule.forRoot({
    langs: { pl },
    translocoConfig: {
      availableLangs: ['pl'],
      defaultLang: 'pl',
      fallbackLang: 'pl',
      reRenderOnLangChange: true
    },
    preloadLangs: true
  })
];

export const TEST_PROVIDERS = [
  provideHttpClient(withInterceptorsFromDi()),
  provideHttpClientTesting(),
  providePrimeNG({
    ripple: true,
    inputVariant: 'outlined',
    translation: {
      accept: 'Tak',
      reject: 'Nie',
      choose: 'Wybierz',
      cancel: 'Anuluj',
      clear: 'Wyczyść',
      today: 'Dzisiaj',
      emptyMessage: 'Brak dostępnych opcji',
      emptyFilterMessage: 'Nie znaleziono wyników',
    },
    theme: {
      preset: Lara,
      options: {
        darkModeSelector: false,
      },
    },
  }),
  ConfirmationService,
  {
    provide: ActivatedRoute,
    useValue: {
      paramMap: of(paramMap),
      params: of(routeParams),
      snapshot: {
        paramMap,
        params: routeParams,
      },
      parent: {
        paramMap: of(paramMap),
        params: of(routeParams),
        snapshot: {
          paramMap,
          params: routeParams,
        },
      },
    },
  },
];
