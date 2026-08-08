import { BusinessPartner, PaymentCondition, PaymentMethod, Quote } from '@friday/core';
import { SERODIO_COMPANY } from '@friday/core';

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

/**
 * Builds the Orçamento (quote) pages, using the same letterhead layout applied to the Contrato
 * and Ordem de Serviço, populated with the quote's itemized products and payment condition.
 *
 * Note: this reproduces the general orçamento layout Serodio uses (client, itens, condições de
 * pagamento e validade), not a literal clone of a specific past quote document.
 */
export function buildQuotePages(quote: Quote, businessPartner: BusinessPartner | null): string[] {
  const clientName = businessPartner?.name ?? quote.businessPartnerName ?? '-';
  const clientDoc = partnerDocument(businessPartner);
  const clientAddress = partnerAddress(businessPartner);

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

  const page1 = `
    <h1>ORÇAMENTO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE</h1>
    <p class="doc-number">N°. ${quote.quoteNumber ?? '-'}</p>
    <table>
      <tbody>
        <tr><td style="width:30%"><b>CLIENTE</b></td><td>${clientName}</td></tr>
        <tr><td><b>CNPJ/CPF</b></td><td>${clientDoc}</td></tr>
        <tr><td><b>ENDEREÇO</b></td><td>${clientAddress}</td></tr>
        <tr><td><b>DATA</b></td><td>${formatDate(quote.date)}</td></tr>
      </tbody>
    </table>

    <h2>Itens Orçados</h2>
    <table>
      <thead>
        <tr><th>Descrição</th><th>Qtd.</th><th>Valor Unit.</th><th>Desconto</th><th>Total</th></tr>
      </thead>
      <tbody>${productRows}</tbody>
    </table>
    <table>
      <tbody>
        <tr><td style="width:70%"><b>Valor Total</b></td><td>${formatCurrency(quote.totalPrice)}</td></tr>
        <tr><td><b>Condição de Pagamento</b></td><td>${paymentConditionLabel(quote.condition)}</td></tr>
        <tr><td><b>Forma de Pagamento</b></td><td>${paymentMethodLabel(quote.method)}</td></tr>
      </tbody>
    </table>

    <h2>Condições Gerais</h2>
    <p>1. Este orçamento tem validade de 10 (dez) dias corridos a partir da data de emissão.</p>
    <p>2. Os valores apresentados poderão sofrer alterações em caso de mudança de roteiro,
      quilometragem, datas ou quantidade de passageiros informados na solicitação.</p>
    <p>3. A confirmação do serviço está sujeita à disponibilidade de veículo e motorista na data
      solicitada, e será formalizada mediante assinatura de contrato e pagamento do sinal.</p>
    <p>4. Despesas com pedágio, estacionamento, hospedagem e alimentação do(s) motorista(s), quando
      aplicável, não estão incluídas neste orçamento, salvo indicação em contrário.</p>
    <p>5. Cancelamentos e alterações seguem as condições descritas no contrato de prestação de
      serviços firmado no momento da confirmação.</p>
    <p>6. Dúvidas e informações adicionais podem ser tratadas diretamente com
      ${SERODIO_COMPANY.officeContactName}, pelo telefone ${SERODIO_COMPANY.whatsapp}.</p>

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

  return [page1];
}
