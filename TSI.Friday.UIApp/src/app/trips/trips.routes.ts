import { Routes } from '@angular/router';

import { TripsComponent } from './trips.component';
import { TripDetailsPageComponent } from './components/trip-details-page/trip-details-page.component';

export const TRIPS_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: TripsComponent,
      },
      {
        path: 'new',
        component: TripDetailsPageComponent,
      },
      {
        path: ':id',
        component: TripDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];
