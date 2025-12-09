import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initFirebase } from './app/firebase.init';

(async () => {
  await initFirebase();
  await bootstrapApplication(AppComponent, appConfig);
})();
