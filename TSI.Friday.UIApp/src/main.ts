import { bootstrapApplication } from '@angular/platform-browser';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));