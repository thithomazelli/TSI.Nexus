import { Routes } from '@angular/router';
import { AuthorizationGuard } from './core/guards/authorization.guard';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './shared/components/errors/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthorizationGuard],
    component: HomeComponent,
  },
  {
    path: 'account',
    loadChildren: () =>
      import('./account/account.routes').then((m) => m.ACCOUNT_ROUTES),
  },
  {
    path: 'alert-configs',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./alert-configs/alert-configs.routes').then(
        (m) => m.ALERT_CONFIGS_ROUTES,
      ),
  },
  {
    path: 'clients',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./business-partner/business-partner.routes').then(
        (m) => m.BUSINESS_PARTNER_ROUTES,
      ),
  },
  {
    path: 'document-templates',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./document-templates/document-templates.routes').then(
        (m) => m.DOCUMENT_TEMPLATES_ROUTES,
      ),
  },
  {
    path: 'drivers',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./drivers/drivers.routes').then((m) => m.DRIVERS_ROUTING),
  },
  {
    path: 'feature-toggles',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./feature-toggles/feature-toggles.routes').then(
        (m) => m.FEATURE_TOGGLES_ROUTES,
      ),
  },
  {
    path: 'home',
    canActivate: [AuthorizationGuard],
    component: HomeComponent,
  },
  {
    path: 'not-found',
    canActivate: [AuthorizationGuard],
    component: NotFoundComponent,
  },
  {
    path: 'order-products',
    canActivateChild: [AuthorizationGuard],
    data: { featureFlag: ['SalesOrdersModule', 'RentalReport'] },
    loadChildren: () =>
      import('./order-products/order-products.routes').then(
        (m) => m.ORDER_PRODUCTS_ROUTES,
      ),
  },
  {
    path: 'orders',
    canActivateChild: [AuthorizationGuard],
    data: { featureFlag: 'SalesOrdersModule' },
    loadChildren: () =>
      import('./orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: 'payments',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./payments/payments.routes').then((m) => m.PAYMENTS_ROUTES),
  },
  {
    path: 'products',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./products/products.routes').then((m) => m.PRODUCTS_ROUTES),
  },
  {
    path: 'quotes',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./quotes/quotes.routes').then((m) => m.QUOTES_ROUTES),
  },
  {
    path: 'reports',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./reports/reports.routes').then((m) => m.REPORTS_ROUTES),
  },
  {
    path: 'selectable-options',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./selectable-options/selectable-options.routes').then(
        (m) => m.SELECTABLE_OPTIONS_ROUTES,
      ),
  },
  {
    path: 'suppliers',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./business-partner/business-partner.routes').then(
        (m) => m.BUSINESS_PARTNER_ROUTES,
      ),
  },
  {
    path: 'transactions',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./transactions/transactions.routes').then(
        (m) => m.TRANSACTIONS_ROUTES,
      ),
  },
  {
    path: 'trips',
    canActivateChild: [AuthorizationGuard],
    data: { featureFlag: 'FleetModule' },
    loadChildren: () =>
      import('./trips/trips.routes').then((m) => m.TRIPS_ROUTES),
  },
  {
    path: 'users',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./users/users.routes').then((m) => m.USERS_ROUTES),
  },
  {
    path: 'vehicles',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./vehicles/vehicles.routes').then((m) => m.VEHICLES_ROUTES),
  },
  {
    path: '**',
    runGuardsAndResolvers: 'always',
    redirectTo: 'not-found',
  },
];