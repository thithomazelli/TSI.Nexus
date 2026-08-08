import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar.component';
import { OrderProductNotificationComponent } from './components/order-product-notification/order-product-notification.component';
import { PaymentNotificationComponent } from './components/payment-notification/payment-notification.component';
import { DriverLicenseNotificationComponent } from './components/driver-license-notification/driver-license-notification.component';
import { VehicleBlockedNotificationComponent } from './components/vehicle-blocked-notification/vehicle-blocked-notification.component';
import { PaymentsModule } from '../payments/payments.module';
import { OrderProductsModule } from '../order-products/order-products.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    NavbarComponent,
    OrderProductNotificationComponent,
    PaymentNotificationComponent,
    DriverLicenseNotificationComponent,
    VehicleBlockedNotificationComponent,
  ],
  imports: [CommonModule, OrderProductsModule, PaymentsModule, SharedModule],
  exports: [NavbarComponent],
})
export class NavbarModule {}
