import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// Every application has at least one Angular module, 
// the root module that you bootstrap to launch the application. 
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}
// we bootstrap the modules here
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
