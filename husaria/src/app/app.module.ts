import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';
import { SharedModule } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { TranslocoRootModule } from './transloco-root.module';
import { JudgeMobileComponent } from './modules/judge-mobile/judge-mobile.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { SessionInterceptor } from './modules/auth/session.interceptor';

const HusariaPreset = definePreset(Lara, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px'
    }
  },
  semantic: {
    transitionDuration: '0.18s',
    primary: {
      50: '#F8F2FF',
      100: '#F0E7FF',
      200: '#EADDFF',
      300: '#D0BCFF',
      400: '#B69DF8',
      500: '#6750A4',
      600: '#5E459A',
      700: '#4F378B',
      800: '#381E72',
      900: '#21005D',
      950: '#12003B'
    },
    formField: {
      borderRadius: '1rem',
      paddingX: '1rem',
      paddingY: '0.75rem'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#FFFFFF',
          50: '#FFFBFE',
          100: '#F7F2FA',
          200: '#F3EDF7',
          300: '#E7E0EC',
          400: '#CAC4D0',
          500: '#79747E',
          600: '#625B71',
          700: '#49454F',
          800: '#322F35',
          900: '#1C1B1F',
          950: '#141218'
        },
        primary: {
          color: '#6750A4',
          contrastColor: '#FFFFFF',
          hoverColor: '#5E459A',
          activeColor: '#4F378B'
        },
        highlight: {
          background: '#EADDFF',
          focusBackground: '#D0BCFF',
          color: '#21005D',
          focusColor: '#21005D'
        },
        formField: {
          background: '#F7F2FA',
          filledBackground: '#F7F2FA',
          filledHoverBackground: '#F3EDF7',
          filledFocusBackground: '#FFFFFF',
          borderColor: '#CAC4D0',
          hoverBorderColor: '#6750A4',
          focusBorderColor: '#6750A4',
          color: '#1C1B1F',
          placeholderColor: '#625B71',
          iconColor: '#625B71',
          shadow: 'none'
        },
        text: {
          color: '#1C1B1F',
          hoverColor: '#1C1B1F',
          mutedColor: '#625B71',
          hoverMutedColor: '#49454F'
        },
        content: {
          background: '#FFFFFF',
          hoverBackground: '#F7F2FA',
          borderColor: '#E7E0EC',
          color: '#1C1B1F',
          hoverColor: '#1C1B1F'
        }
      }
    }
  }
});

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MainLayoutComponent,
    JudgeMobileComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    RouterModule,
    FormsModule,
    BrowserAnimationsModule,
    TranslocoRootModule
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SessionInterceptor,
      multi: true
    },
    providePrimeNG({
      ripple: true,
      inputVariant: 'filled',
      translation: {
        accept: 'Tak',
        reject: 'Nie',
        choose: 'Wybierz',
        upload: 'Prześlij',
        cancel: 'Anuluj',
        clear: 'Wyczyść',
        today: 'Dzisiaj',
        weekHeader: 'Tydz.',
        firstDayOfWeek: 1,
        dayNames: ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'],
        dayNamesShort: ['ndz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'],
        dayNamesMin: ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'],
        monthNames: ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'],
        monthNamesShort: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
        emptyMessage: 'Brak dostępnych opcji',
        emptyFilterMessage: 'Nie znaleziono wyników'
      },
      theme: {
        preset: HusariaPreset,
        options: {
          darkModeSelector: false
        }
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
