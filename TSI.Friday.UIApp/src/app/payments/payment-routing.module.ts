import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentsComponent } from './payments.component';
import { PaymentDetailsPageComponent } from './components/payment-details-page/payment-details-page.component';

const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: PaymentsComponent,
      },
      {
        path: 'new',
        component: PaymentDetailsPageComponent,
      },
      {
        path: ':id',
        component: PaymentDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PaymentsRoutingModule {}
