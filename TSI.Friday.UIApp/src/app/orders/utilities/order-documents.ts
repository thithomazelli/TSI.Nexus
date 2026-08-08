import { BusinessPartner, Driver, Order, TripLeg, Vehicle } from '@friday/core';
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

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
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

/**
 * Builds the "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE DE PASSAGEIROS SOB O REGIME DE
 * FRETAMENTO EVENTUAL" pages, following clause-by-clause the contract template Serodio already
 * uses with its clients, populated with the trip's real data.
 */
export function buildContractPages(
  order: Order,
  businessPartner: BusinessPartner | null,
  vehicle: Vehicle | null,
  tripLegs: TripLeg[],
): string[] {
  const contratanteName = businessPartner?.name ?? order.businessPartnerName ?? '-';
  const contratanteDoc = partnerDocument(businessPartner);
  const contratanteAddress = partnerAddress(businessPartner);
  const kmExcedente = vehicle ? formatCurrency(vehicle.pricePerKm) : 'a combinar';
  const diariaExtra = vehicle ? formatCurrency(vehicle.dailyRate) : 'a combinar';
  const limiteKm = order.distanceKm ? `${order.distanceKm} quilômetros` : 'a definir conforme o roteiro';
  const totalPrice = formatCurrency(order.totalPrice);
  const sinal = formatCurrency((order.totalPrice ?? 0) * 0.2);
  const saldo = formatCurrency((order.totalPrice ?? 0) * 0.8);

  const page1 = `
    <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE<br/>DE PASSAGEIROS SOB O REGIME DE FRETAMENTO EVENTUAL</h1>
    <p class="doc-number">N°. ${order.orderNumber ?? '-'}</p>
    <p>
      As partes, de um lado <b>${SERODIO_COMPANY.legalName}</b>, pessoa jurídica de direito privado,
      inscrita no CNPJ sob o nº <b>${SERODIO_COMPANY.cnpj}</b>, com sede na
      <b>${SERODIO_COMPANY.addressLine}</b>, por seu representante infra-assinado, doravante
      denominada <b>CONTRATADA</b>, e de outro lado <b>${contratanteName}</b>, CNPJ/CPF nº
      <b>${contratanteDoc}</b>, endereço <b>${contratanteAddress}</b>, doravante denominado
      <b>CONTRATANTE</b>, resolvem celebrar o presente Contrato de Prestação de Serviços de
      Transporte de Passageiros sob o Regime de Fretamento Eventual, o qual será regido pelas
      cláusulas e condições a seguir estabelecidas:
    </p>
    <p><span class="clause-title">Cláusula Primeira.</span> A CONTRATADA prestará à CONTRATANTE
      serviço de transporte de passageiros, sob o regime de fretamento eventual, a ser realizado em
      ônibus de acordo com as características, horários e itinerários descritos no ANEXO I, o qual
      passa a fazer parte integrante deste instrumento.</p>
    <p><span class="clause-title">Parágrafo Único.</span> A finalidade da viagem é: TURISMO</p>
    <p><span class="clause-title">Cláusula Segunda.</span> Pela presente prestação de serviços de
      fretamento eventual ora contratado, a CONTRATANTE pagará à CONTRATADA a importância de
      <b>${totalPrice}</b>, com limite de até <b>${limiteKm}</b>.</p>
    <p><span class="clause-title">Parágrafo Primeiro.</span> A importância descrita no caput desta
      cláusula será quitada conforme descrito no ANEXO I ao final deste contrato.</p>
    <p><span class="clause-title">Parágrafo Segundo.</span> Se a viagem exceder a quilometragem
      estabelecida no caput, além do valor acima estipulado, será cobrado <b>${kmExcedente}</b> por
      quilômetro excedido, o que será aferido ao final da viagem, sendo que essa diferença, se
      houver, deverá ser quitada no prazo de 15 dias, contados do término da viagem, mediante o
      pagamento do respectivo boleto bancário.</p>
    <p><span class="clause-title">Parágrafo Terceiro.</span> Se a duração da viagem ultrapassar o
      limite de dias previstos neste contrato, por culpa (negligência, imprudência ou imperícia) da
      CONTRATANTE ou ocorrência de fato que não se enquadre em motivos de CASO FORTUITO E FORÇA
      MAIOR nos termos do art. 393 do Código Civil Brasileiro, ficará a CONTRATANTE obrigada ao
      pagamento de diárias extras no valor de <b>${diariaExtra}</b>.</p>
    <p><span class="clause-title">Parágrafo Quarto.</span> A parte CONTRATANTE não poderá alegar a
      exceção prevista nos termos do art. 393 do Código Civil Brasileiro em relação a cobrança de
      diárias extras quando no momento da negociação comercial for exposto os riscos inerentes a
      viagem que deverão estar especificados no ANEXO I do presente instrumento.</p>
    <p><span class="clause-title">Parágrafo Quinto.</span> O pagamento fora dos prazos estabelecidos
      nos parágrafos anteriores acarretará a aplicação de correção monetária com base no INPC-IBGE,
      juros moratórios de 1% (um por cento) ao mês, e multa de 2% (dois por cento) sobre o valor
      inadimplido, até a data do efetivo pagamento.</p>
    <p><span class="clause-title">Parágrafo Sexto.</span> Fica neste ato ciente a CONTRATANTE que
      para a constituição da presente contratação necessário se faz o pagamento integral, antes de
      seu vencimento, do valor descrito no ANEXO I a título de entrada, sob pena de ser
      caracterizado cancelamento e/ou rescisão do presente contrato, motivado pela CONTRATANTE.</p>
  `;

  const page2 = `
    <p><span class="clause-title">Parágrafo Sétimo.</span> A nota fiscal será emitida uma semana
      antes da viagem requerida pela parte CONTRATANTE. No caso de desistência, cancelamento e/ou
      rescisão de contrato a pedido da CONTRATANTE, e já havendo sido emitida a Nota Fiscal, ficará
      a cargo da CONTRATANTE o pagamento devido dos impostos inerentes da emissão de tal Nota, como
      PIS - 0,65%, COFINS 3%, IRPJ/CSLL - 34% sobre o lucro líquido (receita/custo e despesa) e
      ICMS.</p>
    <p><span class="clause-title">Cláusula Terceira.</span> Independentemente do valor estipulado na
      Cláusula Segunda, ficarão a cargo da CONTRATANTE as despesas com alimentação do(s)
      motorista(s), bem como a cargo da CONTRATANTE as despesas com hospedagem do(s) motorista(s), e
      por fim por conta da CONTRATANTE as taxas turísticas e despesas com estacionamento.</p>
    <p><span class="clause-title">Cláusula Quarta.</span> A CONTRATANTE obriga-se a:</p>
    <p>
      a) Nomear uma pessoa para ser responsável pela viagem durante a execução do serviço, a qual
      compromete-se a zelar pelo bom andamento da viagem;<br/>
      b) Fornecer listagem constando todos os dados exigidos pelos órgãos regulamentadores com 7
      dias de antecedência a data da viagem;<br/>
      c) Reunir todos os passageiros nos locais e horários estabelecidos;<br/>
      d) Respeitar todas as normas relativas à viagem estabelecidas pela CONTRATADA;<br/>
      e) Não transportar passageiros em número superior à capacidade do ônibus;<br/>
      f) Não usar o veículo para outras finalidades que não a de transporte de passageiros;<br/>
      g) Obter os alvarás e autorizações necessárias;<br/>
      h) Arcar com taxas turísticas;<br/>
      i) Comunicar, por escrito, qualquer alteração de veículo, data, horário e/ou endereço no
      mínimo 20 dias antes da data da viagem, sendo que tais alterações serão avaliadas conforme
      disponibilidade da CONTRATADA podendo haver alterações no preço ora ajustado;<br/>
      j) Reparar todos os danos e extravios ocorridos no veículo, causados pela CONTRATANTE e/ou por
      passageiros.
    </p>
    <p><span class="clause-title">Cláusula Quinta.</span> A CONTRATADA obriga-se a:</p>
    <p>
      a) Fornecer o ônibus em conformidade com o ANEXO I deste instrumento, atendendo todas as
      exigências de ordem legal;<br/>
      b) Arcar com todas as despesas de mão-de-obra, combustível, lubrificantes, peças e
      manutenção, necessários a execução dos serviços objeto deste instrumento;<br/>
      c) Manter seguro obrigatório de danos pessoais, previsto no Código Nacional de Trânsito;<br/>
      d) Substituir imediatamente os ônibus que não apresentarem condições de transporte, por avaria
      mecânica ou qualquer outro motivo, onde quer que estes se encontrem, prosseguindo na condução
      das pessoas transportadas;<br/>
      e) Fornecer condutores devidamente capacitados e habilitados que observem rigorosamente as
      disposições legais e regulamentares no que se refere à condução do ônibus, bem como trajados e
      identificados, e em condições de higiene pessoal;<br/>
      f) Responsabilizar-se pelo registro e habilitação dos seus contratados para o serviço,
      respondendo exclusivamente por ônus e encargos decorrentes dos contratos de trabalho, por toda
      e qualquer ação trabalhista e/ou indenizatória, bem como por eventuais autuações/multas por
      parte de órgãos fiscalizadores.
    </p>
    <p><span class="clause-title">Cláusula Sexta.</span> A CONTRATANTE receberá o veículo em
      condições normais de funcionamento, devendo vistoriá-lo no ato da sua apresentação não cabendo
      qualquer reclamação posterior.</p>
  `;

  const page3 = `
    <p><span class="clause-title">Cláusula Sétima.</span> Não será realizado o transporte em
      estradas não pavimentadas, estradas de chão, pedra, cascalho ou em qualquer outro trajeto da
      mesma natureza.</p>
    <p><span class="clause-title">Cláusula Oitava.</span> A CONTRATADA não se responsabilizará pela
      ausência da CONTRATANTE e seus passageiros nos locais de embarque nos horários
      estabelecidos.</p>
    <p><span class="clause-title">Cláusula Nona.</span> Os passageiros transportados durante a
      referida prestação de serviços estarão cobertos por seguro de responsabilidade civil contra
      acidentes pessoais, conforme a regulamentação de transporte rodoviário de passageiros
      aplicável.</p>
    <p><span class="clause-title">Cláusula Décima.</span> O descumprimento a qualquer cláusula do
      presente instrumento acarretará sua rescisão de pleno direito, sendo aplicada à parte
      infratora multa de 10% (dez por cento) do valor total do presente contrato, que será revertida
      em favor da parte inocente, sendo que, no caso de cancelamento da viagem por parte da
      CONTRATANTE serão aplicadas as disposições da Cláusula Décima Primeira deste instrumento.</p>
    <p><span class="clause-title">Cláusula Décima Primeira.</span> Em caso de cancelamento da viagem
      por parte da CONTRATANTE, esta ficará obrigada ao pagamento de multa correspondente a 30% do
      valor contratado, sendo que os valores já pagos pela CONTRATANTE serão compensados para
      apuração e pagamento da multa.</p>
    <p><span class="clause-title">Cláusula Décima Segunda.</span> Este contrato não estabelece
      vínculo de qualquer natureza nem envolve responsabilidade solidária e/ou subsidiária entre as
      partes, bem como seus funcionários ou prepostos, sujeitando-se apenas ao pactuado neste
      instrumento.</p>
    <p><span class="clause-title">Cláusula Décima Terceira.</span> Qualquer tolerância ou omissão em
      exigir o estrito cumprimento de quaisquer das Cláusulas ou condições deste contrato, ou
      exercer direito delas decorrentes, não constituirá renúncia às mesmas, e não prejudicará a
      faculdade das partes em exigi-las ou exercê-los a qualquer tempo.</p>
    <p><span class="clause-title">Cláusula Décima Quarta.</span> Elegem as partes, de comum acordo,
      o Foro da Comarca de Guarulhos - SP, para dirimir quaisquer questões oriundas do presente
      Instrumento, renunciando a qualquer outro por mais privilegiado que seja.</p>
    <p><span class="clause-title">Cláusula Décima Quinta.</span> Quando fornecido o Kit Conforto, em
      caso de extravio, será cobrado da CONTRATANTE o valor de R$ 75,00 a manta (unidade) e R$ 25,00
      o travesseiro (unidade).</p>
    <p style="margin-top: 16px;">E por estarem assim justos e contratados, as partes firmam o
      presente em 2 (duas) vias de igual teor e forma, bem como assinam o presente instrumento as
      testemunhas abaixo.</p>
  `;

  const legRows = tripLegs.length
    ? tripLegs
        .map(
          (leg) => `
            <tr>
              <td>${leg.sequenceNumber}</td>
              <td>${leg.origin}</td>
              <td>${leg.destination}</td>
              <td>${formatDateTime(leg.departureDate)}</td>
              <td>${leg.distanceKm ?? 0} km</td>
            </tr>
          `,
        )
        .join('')
    : `<tr><td colspan="5">${order.route || 'Roteiro conforme combinado com o cliente.'}</td></tr>`;

  const page4 = `
    <h2>ANEXO I - Roteiro, Veículo e Condições de Pagamento</h2>
    <table>
      <thead>
        <tr><th>Nº</th><th>Origem</th><th>Destino</th><th>Saída</th><th>Distância</th></tr>
      </thead>
      <tbody>${legRows}</tbody>
    </table>
    <p><b>Veículo:</b> ${vehicle ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model} (${vehicle.seatCapacity} lugares)` : 'A definir'}</p>
    <p><b>Data da viagem:</b> ${formatDate(order.date)}</p>
    <table>
      <thead>
        <tr><th>Descrição</th><th>Valor</th></tr>
      </thead>
      <tbody>
        <tr><td>Sinal (20%)</td><td>${sinal}</td></tr>
        <tr><td>Saldo (80%)</td><td>${saldo}</td></tr>
        <tr><td><b>Valor total</b></td><td><b>${totalPrice}</b></td></tr>
      </tbody>
    </table>
    <p style="margin-top: 10px;">Forma de pagamento: conforme combinado com a CONTRATADA.</p>

    <div class="signature-block">
      <div class="signature-column">
        <img
          class="signature-image"
          src="${SERODIO_COMPANY.signaturePath}"
          alt="Assinatura"
        /><br/>
        <div class="signature-line">
          ${SERODIO_COMPANY.legalName}<br/>CONTRATADA
        </div>
      </div>
      <div class="signature-column">
        <div class="signature-line" style="margin-top: 32px;">
          ${contratanteName}<br/>CONTRATANTE
        </div>
      </div>
    </div>
  `;

  return [page1, page2, page3, page4];
}

/**
 * Builds the driver dispatch sheet ("Ordem de Serviço") pages, following the same layout Serodio
 * already uses: trip/vehicle/driver header, KM/fuel checklist for the driver to fill in, standing
 * operational instructions, and (when generated) the commission value for the trip.
 */
export function buildServiceOrderPages(
  order: Order,
  vehicle: Vehicle | null,
  driver: Driver | null,
  passengerCount: number,
  commissionAmount: number | null,
): string[] {
  const page1 = `
    <h1>ORDEM DE SERVIÇO</h1>
    <p class="doc-number">Pedido ${order.orderNumber ?? '-'}</p>
    <table>
      <tbody>
        <tr><td><b>MOTORISTA</b></td><td>${driver?.name ?? '-'}</td></tr>
        <tr><td><b>TIPO DE SERVIÇO</b></td><td>TURISMO</td></tr>
        <tr><td><b>VEÍCULO</b></td><td>${vehicle?.plate ?? '-'} ${vehicle ? `- ${vehicle.brand} ${vehicle.model}` : ''}</td></tr>
        <tr><td><b>INÍCIO</b></td><td>${formatDate(order.date)}</td></tr>
        <tr><td><b>ROTEIRO</b></td><td>${order.route || '-'}</td></tr>
        <tr><td><b>DISTÂNCIA PREVISTA</b></td><td>${order.distanceKm ?? 0} km</td></tr>
        <tr><td><b>QUANTIDADE DE PASSAGEIROS</b></td><td>${passengerCount}</td></tr>
        ${
          commissionAmount != null
            ? `<tr><td><b>VALOR COMISSÃO</b></td><td>${formatCurrency(commissionAmount)}</td></tr>`
            : ''
        }
      </tbody>
    </table>

    <h2>Atenção: informações importantes</h2>
    <table>
      <tbody>
        <tr><td style="width:50%">KM INICIAL:</td><td style="width:50%">KM FINAL:</td></tr>
        <tr><td>HORÁRIO DE INÍCIO NO CLIENTE:</td><td>HORÁRIO DE TÉRMINO NO CLIENTE:</td></tr>
        <tr><td colspan="2">ABASTECIMENTO NA GARAGEM: __________ LITROS</td></tr>
      </tbody>
    </table>

    <p>- Favor abastecer o veículo com água mineral. Verificar todos os equipamentos eletrônicos,
      principalmente o microfone.</p>
    <p>- Ler atentamente os dados da Ordem de Serviço, incluindo as observações. Em caso de dúvidas,
      entrar em contato com o escritório.</p>
    <p>- Apresentar-se com no mínimo 15 minutos de antecedência do horário marcado na Ordem de
      Serviço, sempre uniformizado.</p>
    <p>- Todo início de atendimento em qualquer ponto da cidade, comunicar ao responsável que já se
      encontra próximo do local. Caso não haja comunicação, entrar em contato com o escritório pelo
      telefone ${SERODIO_COMPANY.whatsapp} (${SERODIO_COMPANY.officeContactName}).</p>
    <p>- Qualquer divergência entre os dados da Ordem de Serviço e a solicitação do cliente, nos
      comunicar imediatamente.</p>
    <p>- Tenha bom senso e dirija com consciência.</p>

    <div class="signature-block">
      <div class="signature-column">
        <div class="signature-line">Assinatura do Motorista</div>
      </div>
      <div class="signature-column">
        <img class="signature-image" src="${SERODIO_COMPANY.signaturePath}" alt="Assinatura" /><br/>
        <div class="signature-line">${SERODIO_COMPANY.legalName}</div>
      </div>
    </div>
  `;

  return [page1];
}
