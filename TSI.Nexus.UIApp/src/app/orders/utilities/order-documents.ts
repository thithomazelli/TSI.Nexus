import { Observable, map } from 'rxjs';
import {
  BusinessPartner,
  DocumentTemplateService,
  DocumentTemplateType,
  Order,
  PaymentMethod,
  SERODIO_COMPANY,
  renderDocumentTemplate,
  splitTemplatePages,
} from '@nexus/core';

function formatCurrency(value?: number | null): string {
  return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value?: Date | string | null): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleDateString('pt-BR');
}

function partnerDocument(partner?: BusinessPartner | null): string {
  if (!partner) {
    return '-';
  }
  return partner.nationalRegistry || partner.socialSecurityCard || '-';
}

function partnerAddress(partner?: BusinessPartner | null): string {
  const address = partner?.addresses?.find((a) => a.isDefault) ?? partner?.addresses?.[0];
  if (!address) {
    return '-';
  }
  return `${address.street ?? ''}, nº ${address.number ?? 's/n'} - ${address.city ?? ''}/${address.state ?? ''}`;
}

function paymentMethodLabel(method?: PaymentMethod | null): string {
  switch (method) {
    case PaymentMethod.Cash:
      return 'Dinheiro';
    case PaymentMethod.Pix:
      return 'Pix';
    case PaymentMethod.CreditCard:
      return 'Cartão de Crédito';
    default:
      return 'A combinar';
  }
}

function signatureBlock(clientName: string): string {
  return `
    <div class="signature-block">
      <div class="signature-column">
        <img class="signature-image" src="${SERODIO_COMPANY.signaturePath}" alt="Assinatura" /><br/>
        <div class="signature-line">${SERODIO_COMPANY.legalName}</div>
      </div>
      <div class="signature-column">
        <div class="signature-line" style="margin-top: 32px;">${clientName}</div>
      </div>
    </div>
  `;
}

/**
 * Fetches the Pedido de Venda admin-editable template and substitutes its tokens with the
 * order's product list, totals and payment method.
 */
export function buildSalesOrderPages(
  documentTemplateService: DocumentTemplateService,
  order: Order,
  businessPartner: BusinessPartner | null,
): Observable<string[]> {
  const clientName = businessPartner?.name ?? order.businessPartnerName ?? '-';

  const productRows = order.orderProducts?.length
    ? order.orderProducts
        .map(
          (item) => `
            <tr>
              <td>${item.productName ?? '-'}</td>
              <td>${item.quantity ?? 0}</td>
              <td>${formatCurrency(item.price)}</td>
              <td>${formatCurrency(item.discount)}</td>
              <td>${formatCurrency(item.totalPrice)}</td>
            </tr>
          `,
        )
        .join('')
    : `<tr><td colspan="5">${order.description || 'Conforme descrito no pedido.'}</td></tr>`;

  return documentTemplateService.getByType(DocumentTemplateType.SalesOrder).pipe(
    map((response) => {
      const rendered = renderDocumentTemplate(response.data?.content ?? '', {
        OrderNumber: order.orderNumber ?? '-',
        ClientName: clientName,
        ClientDocument: partnerDocument(businessPartner),
        ClientAddress: partnerAddress(businessPartner),
        OrderDate: formatDate(order.date),
        ProductRows: productRows,
        TotalPrice: formatCurrency(order.totalPrice),
        PaymentMethod: paymentMethodLabel(order.transaction?.method),
        CompanyContactName: SERODIO_COMPANY.officeContactName,
        CompanyWhatsapp: SERODIO_COMPANY.whatsapp,
        SignatureBlock: signatureBlock(clientName),
      });
      return splitTemplatePages(rendered);
    }),
  );
}
