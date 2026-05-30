import { isDevMode, NgModule } from '@angular/core';
import { provideTransloco, TranslocoModule } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader';

@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['pl'],
        defaultLang: 'pl',
        fallbackLang: 'pl',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: isDevMode(),
          useFallbackTranslation: true
        }
      },
      loader: TranslocoHttpLoader
    })
  ]
})
export class TranslocoRootModule {}
