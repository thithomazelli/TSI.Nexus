import { Observable, map } from 'rxjs';
import {
  BusinessPartner,
  DocumentTemplateService,
  DocumentTemplateType,
  PaymentCondition,
  PaymentMethod,
  Quote,
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

function paymentConditionLabel(condition?: PaymentCondition | null): string {
  switch (condition) {
    case PaymentCondition.FullPayment:
      return 'À vista';
    case PaymentCondition.InInstallments:
      return 'Parcelado';
    default:
      return 'A combinar';
  }
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
 * Fetches the Orçamento admin-editable template and substitutes its tokens with the quote's
 * itemized products and payment condition.
 */
export function buildQuotePages(
  documentTemplateService: DocumentTemplateService,
  quote: Quote,
  businessPartner: BusinessPartner | null,
): Observable<string[]> {
  const clientName = businessPartner?.name ?? quote.businessPartnerName ?? '-';

  const productRows = quote.quoteProducts?.length
    ? quote.quoteProducts
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
    : `<tr><td colspan="5">${quote.description || 'Conforme descrito na proposta.'}</td></tr>`;

  return documentTemplateService.getByType(DocumentTemplateType.Quote).pipe(
    map((response) => {
      const rendered = renderDocumentTemplate(response.data?.content ?? '', {
        QuoteNumber: quote.quoteNumber ?? '-',
        ClientName: clientName,
        ClientDocument: partnerDocument(businessPartner),
        ClientAddress: partnerAddress(businessPartner),
        QuoteDate: formatDate(quote.date),
        ProductRows: productRows,
        TotalPrice: formatCurrency(quote.totalPrice),
        PaymentCondition: paymentConditionLabel(quote.condition),
        PaymentMethod: paymentMethodLabel(quote.method),
        CompanyContactName: SERODIO_COMPANY.officeContactName,
        CompanyWhatsapp: SERODIO_COMPANY.whatsapp,
        SignatureBlock: signatureBlock(clientName),
      });
      return splitTemplatePages(rendered);
    }),
  );
}
