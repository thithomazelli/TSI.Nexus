import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TripsComponent } from './trips.component';
import { TripDetailsPageComponent } from './components/trip-details-page/trip-details-page.component';

const routes: Routes = [
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

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TripsRoutingModule {}
