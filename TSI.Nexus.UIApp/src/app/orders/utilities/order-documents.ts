import { BusinessPartner, Order, Payment, PaymentMethod, PaymentStatus } from '@nexus/core';
import { COMPANY_BRANDING } from '@nexus/core';

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

function paymentStatusLabel(status?: PaymentStatus | null): string {
  switch (status) {
    case PaymentStatus.Approved:
      return 'Pago';
    case PaymentStatus.Delayed:
      return 'Atrasado';
    case PaymentStatus.Pending:
      return 'Pendente';
    default:
      return '-';
  }
}

function productRowsHtml(order: Order): string {
  return order.orderProducts?.length
    ? order.orderProducts
        .map(
          (item) => `
            <tr>
              <td>${item.productName ?? item.description ?? '-'}</td>
              <td>${item.quantity ?? 0}</td>
              <td>${formatCurrency(item.price)}</td>
              <td>${formatCurrency(item.discount)}</td>
              <td>${formatCurrency(item.totalPrice)}</td>
            </tr>
          `,
        )
        .join('')
    : `<tr><td colspan="5">${order.description || 'Conforme descrito no pedido.'}</td></tr>`;
}

function paymentScheduleRowsHtml(payments: Payment[]): string {
  return payments.length
    ? payments
        .map(
          (payment, index) => `
            <tr>
              <td>${payment.paymentNumber ?? index + 1}</td>
              <td>${formatDate(payment.date)}</td>
              <td>${paymentMethodLabel(payment.method)}</td>
              <td>${formatCurrency(payment.price)}</td>
              <td>${paymentStatusLabel(payment.status)}</td>
            </tr>
          `,
        )
        .join('')
    : '<tr><td colspan="5">Nenhum pagamento cadastrado para este pedido.</td></tr>';
}

function signatureBlock(clientName: string): string {
  return `
    <div class="signature-block">
      <div class="signature-column">
        <div class="signature-line" style="margin-top: 32px;">${COMPANY_BRANDING.legalName}</div>
      </div>
      <div class="signature-column">
        <div class="signature-line" style="margin-top: 32px;">${clientName}</div>
      </div>
    </div>
  `;
}

/**
 * Builds the "Pedido de Venda" pages: a confirmation of a placed Order, itemizing its
 * OrderProducts and the agreed payment schedule. This is the Order-side counterpart of the
 * Orçamento (quote) document, using only generic Order/Client/Product/Payment data - no
 * business-specific fields.
 */
export function buildSalesOrderPages(
  order: Order,
  businessPartner: BusinessPartner | null,
  payments: Payment[],
): string[] {
  const clientName = businessPartner?.name ?? order.businessPartnerName ?? '-';
  const clientDoc = partnerDocument(businessPartner);
  const clientAddress = partnerAddress(businessPartner);

  const page1 = `
    <h1>PEDIDO DE VENDA</h1>
    <p class="doc-number">N°. ${order.orderNumber ?? '-'}</p>
    <table>
      <tbody>
        <tr><td style="width:30%"><b>CLIENTE</b></td><td>${clientName}</td></tr>
        <tr><td><b>CNPJ/CPF</b></td><td>${clientDoc}</td></tr>
        <tr><td><b>ENDEREÇO</b></td><td>${clientAddress}</td></tr>
        <tr><td><b>DATA</b></td><td>${formatDate(order.date)}</td></tr>
        ${order.quoteNumber ? `<tr><td><b>ORÇAMENTO DE ORIGEM</b></td><td>${order.quoteNumber}</td></tr>` : ''}
      </tbody>
    </table>

    <h2>Itens do Pedido</h2>
    <table>
      <thead>
        <tr><th>Descrição</th><th>Qtd.</th><th>Valor Unit.</th><th>Desconto</th><th>Total</th></tr>
      </thead>
      <tbody>${productRowsHtml(order)}</tbody>
    </table>
    <table>
      <tbody>
        <tr><td style="width:70%"><b>Valor Total</b></td><td>${formatCurrency(order.totalPrice)}</td></tr>
      </tbody>
    </table>

    <h2>Condição de Pagamento</h2>
    <table>
      <thead>
        <tr><th>N°.</th><th>Vencimento</th><th>Forma</th><th>Valor</th><th>Situação</th></tr>
      </thead>
      <tbody>${paymentScheduleRowsHtml(payments)}</tbody>
    </table>

    ${signatureBlock(clientName)}
  `;

  return [page1];
}

/**
 * Builds a generic "Contrato de Prestação de Serviços" - the object contracted, its total value
 * and payment schedule, and standard service-provision clauses. Deliberately generic (no
 * business-specific fields like vehicle/route) so it applies to any Order regardless of what
 * kind of Products/services it contains.
 */
export function buildContractPages(
  order: Order,
  businessPartner: BusinessPartner | null,
  payments: Payment[],
): string[] {
  const clientName = businessPartner?.name ?? order.businessPartnerName ?? '-';
  const clientDoc = partnerDocument(businessPartner);
  const clientAddress = partnerAddress(businessPartner);
  const totalPrice = formatCurrency(order.totalPrice);

  const startDates = (order.orderProducts ?? [])
    .map((p) => (p.startDate ? new Date(p.startDate).getTime() : null))
    .filter((t): t is number => t !== null);
  const endDates = (order.orderProducts ?? [])
    .map((p) => (p.endDate ? new Date(p.endDate).getTime() : null))
    .filter((t): t is number => t !== null);
  const executionStart = startDates.length ? formatDate(new Date(Math.min(...startDates))) : '-';
  const executionEnd = endDates.length ? formatDate(new Date(Math.max(...endDates))) : '-';

  const page1 = `
    <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
    <p class="doc-number">N°. ${order.orderNumber ?? '-'}</p>

    <p><b>CONTRATADA:</b> ${COMPANY_BRANDING.legalName}, CNPJ ${COMPANY_BRANDING.cnpj}, com sede em
      ${COMPANY_BRANDING.addressLine}.</p>
    <p><b>CONTRATANTE:</b> ${clientName}, CPF/CNPJ ${clientDoc}, com endereço em ${clientAddress}.</p>

    <p>As partes acima identificadas têm, entre si, justo e contratado o presente instrumento
      particular de prestação de serviços, que se regerá pelas cláusulas seguintes.</p>

    <h2>Cláusula 1ª - Do Objeto</h2>
    <table>
      <thead>
        <tr><th>Descrição</th><th>Qtd.</th><th>Valor Unit.</th><th>Desconto</th><th>Total</th></tr>
      </thead>
      <tbody>${productRowsHtml(order)}</tbody>
    </table>

    <h2>Cláusula 2ª - Do Valor e da Forma de Pagamento</h2>
    <p>O valor total dos serviços contratados é de <b>${totalPrice}</b>, a ser pago conforme o
      cronograma abaixo.</p>
    <table>
      <thead>
        <tr><th>N°.</th><th>Vencimento</th><th>Forma</th><th>Valor</th><th>Situação</th></tr>
      </thead>
      <tbody>${paymentScheduleRowsHtml(payments)}</tbody>
    </table>

    <h2>Cláusula 3ª - Do Prazo de Execução</h2>
    <p>Os serviços contratados serão executados no período de ${executionStart} a ${executionEnd},
      podendo ser alterado mediante acordo entre as partes.</p>

    <h2>Cláusula 4ª - Das Obrigações da Contratada</h2>
    <p>Prestar os serviços descritos na Cláusula 1ª com zelo, boa técnica e dentro do prazo
      acordado, comunicando à Contratante qualquer eventualidade que possa afetar sua execução.</p>

    <h2>Cláusula 5ª - Das Obrigações da Contratante</h2>
    <p>Efetuar o pagamento nas datas e condições acordadas na Cláusula 2ª e fornecer as
      informações necessárias à correta execução dos serviços.</p>

    <h2>Cláusula 6ª - Do Cancelamento</h2>
    <p>O cancelamento do presente contrato por qualquer das partes deverá ser comunicado por
      escrito com antecedência mínima de 5 (cinco) dias úteis, ressalvadas as penalidades
      cabíveis por valores já incorridos até a data do cancelamento.</p>

    <h2>Cláusula 7ª - Do Foro</h2>
    <p>Fica eleito o foro da comarca de domicílio da Contratada para dirimir quaisquer dúvidas
      oriundas do presente contrato.</p>

    <p>E por estarem assim justas e contratadas, as partes firmam o presente instrumento.</p>

    ${signatureBlock(clientName)}
  `;

  return [page1];
}

/**
 * Builds a generic "Ordem de Serviço" (work order) listing what's to be executed for the Order -
 * an internal/operational document, distinct from the Contrato (which is the commercial/legal
 * agreement) and the Pedido de Venda (which is the sales confirmation).
 */
export function buildServiceOrderPages(order: Order, businessPartner: BusinessPartner | null): string[] {
  const clientName = businessPartner?.name ?? order.businessPartnerName ?? '-';

  const itemRows = order.orderProducts?.length
    ? order.orderProducts
        .map(
          (item) => `
            <tr>
              <td>${item.productName ?? item.description ?? '-'}</td>
              <td>${item.quantity ?? 0}</td>
              <td>${formatDate(item.startDate)}</td>
              <td>${formatDate(item.endDate)}</td>
              <td>${item.status ?? '-'}</td>
            </tr>
          `,
        )
        .join('')
    : `<tr><td colspan="5">${order.description || 'Conforme descrito no pedido.'}</td></tr>`;

  const page1 = `
    <h1>ORDEM DE SERVIÇO</h1>
    <p class="doc-number">N°. ${order.orderNumber ?? '-'}</p>
    <table>
      <tbody>
        <tr><td style="width:30%"><b>CLIENTE</b></td><td>${clientName}</td></tr>
        <tr><td><b>DATA DE EMISSÃO</b></td><td>${formatDate(order.date)}</td></tr>
      </tbody>
    </table>

    <h2>Itens a Executar</h2>
    <table>
      <thead>
        <tr><th>Descrição</th><th>Qtd.</th><th>Início</th><th>Término</th><th>Situação</th></tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <h2>Observações</h2>
    <p>&nbsp;</p>
    <p>&nbsp;</p>

    ${signatureBlock(clientName)}
  `;

  return [page1];
}
