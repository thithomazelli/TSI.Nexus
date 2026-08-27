import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// ag-Grid's module registration lives in shared/grid/grid.component.ts instead of here - every
// consumer of <app-grid> sits behind a lazy feature route, so registering it there (rather than
// importing ag-grid-community at the app's eager entry point) keeps the ~1MB library out of the
// initial bundle for screens that never render a grid.

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));