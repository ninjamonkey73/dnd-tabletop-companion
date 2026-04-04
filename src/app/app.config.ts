import {
  ApplicationConfig,
  provideZoneChangeDetection,
  provideAppInitializer, // Modern replacement
  ErrorHandler,
  inject,                // Use inject for cleaner dependency handling
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
    
    // Replacing the deprecated APP_INITIALIZER block
    provideAppInitializer(async () => {
      const auth = inject(AuthService);
      const cloud = inject(CloudSyncService);
      const store = inject(CharacterStore);

      // 1. Ensure Firebase is fully initialized before checking auth status
      // This prevents the "Invalid Action" race condition
      if (!auth.isAuthed()) return;

      // 2. Pull user settings for the D&D companion
      const settings = await cloud.pullSettings();

      if (typeof settings?.fullHeal === 'boolean') {
        store.setFullHeal(settings.fullHeal);
      }

      // 3. Load the last active character automatically
      const name = settings?.lastSelectedCharacter || null;
      if (name) {
        const loaded = await cloud.getCharacter(name);
        if (loaded) {
          // Safety checks for spell slot arrays
          if (!Array.isArray(loaded.spellSlots)) loaded.spellSlots = [];
          if (!Array.isArray(loaded.spellSlotsRemaining))
            loaded.spellSlotsRemaining = [];
          
          store.setCharacter(loaded);
        }
      }
    }),
    
    { provide: ErrorHandler, useClass: ConsoleErrorHandler },
  ],
};
