import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizationGuard } from './core/guards/authorization.guard';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './shared/components/errors/not-found/not-found.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthorizationGuard],
    component: HomeComponent,
  },
  {
    path: 'account',
    loadChildren: () =>
      import('./account/account.module').then((m) => m.AccountModule),
  },
  {
    path: 'clients',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./business-partner/business-partner.module').then(
        (m) => m.BusinessPartnerModule,
      ),
  },
  {
    path: 'drivers',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./drivers/drivers.module').then((m) => m.DriversModule),
  },
  {
    path: 'home',
    canActivate: [AuthorizationGuard],
    component: HomeComponent,
  },
  {
    path: 'document-templates',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./document-templates/document-templates.module').then(
        (m) => m.DocumentTemplatesModule,
      ),
  },
  {
    path: 'selectable-options',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./selectable-options/selectable-options.module').then(
        (m) => m.SelectableOptionsModule,
      ),
  },
  {
    path: 'feature-toggles',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./feature-toggles/feature-toggles.module').then(
        (m) => m.FeatureTogglesModule,
      ),
  },
  {
    path: 'alert-configs',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./alert-configs/alert-configs.module').then(
        (m) => m.AlertConfigsModule,
      ),
  },
  {
    path: 'not-found',
    canActivate: [AuthorizationGuard],
    component: NotFoundComponent,
  },
  {
    path: 'orders',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./orders/orders.module').then((m) => m.OrdersModule),
  },
  {
    path: 'trips',
    canActivateChild: [AuthorizationGuard],
    data: { featureFlag: 'FleetModule' },
    loadChildren: () =>
      import('./trips/trips.module').then((m) => m.TripsModule),
  },
  {
    path: 'order-products',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./order-products/order-products.module').then(
        (m) => m.OrderProductsModule,
      ),
  },
  {
    path: 'payments',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./payments/payments.module').then((m) => m.PaymentsModule),
  },
  {
    path: 'products',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./products/products.module').then((m) => m.ProductsModule),
  },
  {
    path: 'quotes',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./quotes/quotes.module').then((m) => m.QuotesModule),
  },
  {
    path: 'reports',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./reports/reports.module').then((m) => m.ReportsModule),
  },
  {
    path: 'suppliers',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./business-partner/business-partner.module').then(
        (m) => m.BusinessPartnerModule,
      ),
  },
  {
    path: 'transactions',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./transactions/transactions.module').then(
        (m) => m.TransactionsModule,
      ),
  },
  {
    path: 'users',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./users/users.module').then((m) => m.UsersModule),
  },
  {
    path: 'vehicles',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./vehicles/vehicles.module').then((m) => m.VehiclesModule),
  },
  {
    path: '**',
    runGuardsAndResolvers: 'always',
    redirectTo: 'not-found',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
