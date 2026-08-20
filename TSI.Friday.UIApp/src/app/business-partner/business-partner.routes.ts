import { Routes } from '@angular/router';
import { BusinessPartnerDetailsPageComponent } from './components/business-partner-details-page/business-partner-details-page.component';
import { BusinessPartnersComponent } from './business-partners.component';

export const BUSINESS_PARTNER_ROUTES: Routes = [
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