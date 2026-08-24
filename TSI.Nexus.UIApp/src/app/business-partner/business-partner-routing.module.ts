import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BusinessPartnerDetailsPageComponent } from './components/business-partner-details-page/business-partner-details-page.component';
import { BusinessPartnersComponent } from './business-partners.component';

const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: BusinessPartnersComponent,
      },
      {
        path: 'new',
        component: BusinessPartnerDetailsPageComponent,
      },
      {
        path: ':id',
        component: BusinessPartnerDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BusinessPartnerRoutingModule {}
