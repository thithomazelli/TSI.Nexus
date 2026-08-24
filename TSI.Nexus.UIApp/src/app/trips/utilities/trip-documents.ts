import { Observable, map } from 'rxjs';
import {
  BusinessPartner,
  Driver,
  DocumentTemplateService,
  DocumentTemplateType,
  SERODIO_COMPANY,
  Trip,
  TripLeg,
  Vehicle,
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

function vehicleInfo(vehicle?: Vehicle | null): string {
  return vehicle
    ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model} (${vehicle.seatCapacity} lugares)`
    : 'A definir';
}

function signatureBlock(contratanteName: string): string {
  return `
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
}

/**
 * Fetches the Contract admin-editable template and substitutes its tokens with the trip's real
 * data, following clause-by-clause the contract template Serodio already uses with its clients.
 */
export function buildContractPages(
  documentTemplateService: DocumentTemplateService,
  trip: Trip,
  businessPartner: BusinessPartner | null,
  vehicle: Vehicle | null,
  tripLegs: TripLeg[],
): Observable<string[]> {
  const contratanteName = businessPartner?.name ?? trip.businessPartnerName ?? '-';
  const contratanteDocument = partnerDocument(businessPartner);
  const contratanteAddress = partnerAddress(businessPartner);
  const kmExcedente = vehicle ? formatCurrency(vehicle.pricePerKm) : 'a combinar';
  const diariaExtra = vehicle ? formatCurrency(vehicle.dailyRate) : 'a combinar';
  const limiteKm = trip.distanceKm ? `${trip.distanceKm} quilômetros` : 'a definir conforme o roteiro';
  const totalPrice = formatCurrency(trip.totalPrice);
  const sinal = formatCurrency((trip.totalPrice ?? 0) * 0.2);
  const saldo = formatCurrency((trip.totalPrice ?? 0) * 0.8);

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
    : `<tr><td colspan="5">${trip.route || 'Roteiro conforme combinado com o cliente.'}</td></tr>`;

  return documentTemplateService.getByType(DocumentTemplateType.Contract).pipe(
    map((response) => {
      const rendered = renderDocumentTemplate(response.data?.content ?? '', {
        TripNumber: trip.tripNumber ?? '-',
        CompanyLegalName: SERODIO_COMPANY.legalName,
        CompanyCnpj: SERODIO_COMPANY.cnpj,
        CompanyAddress: SERODIO_COMPANY.addressLine,
        ContratanteName: contratanteName,
        ContratanteDocument: contratanteDocument,
        ContratanteAddress: contratanteAddress,
        TotalPrice: totalPrice,
        LimiteKm: limiteKm,
        KmExcedente: kmExcedente,
        DiariaExtra: diariaExtra,
        Sinal: sinal,
        Saldo: saldo,
        LegRows: legRows,
        VehicleInfo: vehicleInfo(vehicle),
        TripDate: formatDate(trip.date),
        SignatureBlock: signatureBlock(contratanteName),
      });
      return splitTemplatePages(rendered);
    }),
  );
}

/**
 * Fetches the Ordem de Serviço admin-editable template and substitutes its tokens, following the
 * same layout Serodio already uses: trip/vehicle/driver header, KM/fuel checklist for the driver
 * to fill in, standing operational instructions, and (when generated) the trip's commission value.
 */
export function buildServiceOrderPages(
  documentTemplateService: DocumentTemplateService,
  trip: Trip,
  vehicle: Vehicle | null,
  driver: Driver | null,
  passengerCount: number,
  commissionAmount: number | null,
): Observable<string[]> {
  const commissionRow =
    commissionAmount != null
      ? `<tr><td><b>VALOR COMISSÃO</b></td><td>${formatCurrency(commissionAmount)}</td></tr>`
      : '';

  return documentTemplateService.getByType(DocumentTemplateType.ServiceOrder).pipe(
    map((response) => {
      const rendered = renderDocumentTemplate(response.data?.content ?? '', {
        TripNumber: trip.tripNumber ?? '-',
        DriverName: driver?.name ?? '-',
        VehicleInfo: vehicle ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}` : '-',
        TripDate: formatDate(trip.date),
        Route: trip.route || '-',
        DistanceKm: `${trip.distanceKm ?? 0} km`,
        PassengerCount: String(passengerCount ?? 0),
        CommissionRow: commissionRow,
        CompanyWhatsapp: SERODIO_COMPANY.whatsapp,
        CompanyContactName: SERODIO_COMPANY.officeContactName,
        CompanySignaturePath: SERODIO_COMPANY.signaturePath,
        CompanyLegalName: SERODIO_COMPANY.legalName,
      });
      return splitTemplatePages(rendered);
    }),
  );
}
