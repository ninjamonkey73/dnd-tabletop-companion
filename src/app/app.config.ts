import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  ErrorHandler,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { CloudSyncService } from './cloud-sync.service';
import { CharacterStore } from './character.store';
import { AuthService } from './auth.service';

class ConsoleErrorHandler implements ErrorHandler {
  handleError(error: unknown) {
    console.error('[Global Error]', error);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    {
      provide: APP_INITIALIZER,
      useFactory: (
        cloud: CloudSyncService,
        store: CharacterStore,
        auth: AuthService
      ) => {
        return async () => {
          // Only pull settings if already authed at startup
          if (!auth.isAuthed()) return;

          const settings = await cloud.pullSettings();

          if (typeof settings?.fullHeal === 'boolean') {
            store.setFullHeal(settings.fullHeal);
          }

          const name = settings?.lastSelectedCharacter || null;
          if (name) {
            const loaded = await cloud.getCharacter(name);
            if (loaded) {
              if (!Array.isArray(loaded.spellSlots)) loaded.spellSlots = [];
              if (!Array.isArray(loaded.spellSlotsRemaining))
                loaded.spellSlotsRemaining = [];
              store.setCharacter(loaded);
            }
          }
        };
      },
      deps: [CloudSyncService, CharacterStore, AuthService],
      multi: true,
    },
    { provide: ErrorHandler, useClass: ConsoleErrorHandler },
  ],
};
