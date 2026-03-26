import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentsComponent } from './payments.component';

const routes: Routes = [
  {
    path: '',
    component: PaymentsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PaymentsRoutingModule {}

// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { PaymentsComponent } from './payments.component';
// import { PaymentFormComponent } from './components/payment-form/payment-form.component';
// import { PaymentDetailsModalComponent } from './components/payment-details-modal/payment-details-modal.component';

// const routes: Routes = [
//   {
//     path: '',
//     runGuardsAndResolvers: 'always',
//     children: [
//       {
//         path: '',
//         component: PaymentsComponent,
//         data: { roles: ['Admin'] },
//       },
//       {
//         path: '',
//         component: PaymentFormComponent,
//         data: { roles: ['Admin'] },
//       },
//       {
//         path: '',
//         component: PaymentDetailsModalComponent,
//         data: { roles: ['Admin'] },
//       },
//       {
//         path: ':id',
//         component: PaymentDetailsModalComponent,
//         data: { roles: ['Admin'] },
//       },
//     ],
//   },
// ];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class PaymentsRoutingModule {}
