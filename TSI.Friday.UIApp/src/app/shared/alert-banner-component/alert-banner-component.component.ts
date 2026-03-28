import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-alert-banner-component',
  standalone: false,
  templateUrl: './alert-banner-component.component.html',
  styleUrl: './alert-banner-component.component.scss',
})
export class AlertBannerComponentComponent implements OnInit {
  @Input()
  status: string | undefined = '';

  @Input()
  entity: string = '';

  private _statusIconMap: { [key: string]: string } = {
    Pending: 'info',
    Open: 'info',
    WaitingPayment: 'info',
    InProgress: 'info',
    Approved: 'check',
    Closed: 'check',
    Returned: 'check',
    Delayed: 'exclamation',
    MissingPayments: 'exclamation',
    default: 'info',
  };

  private _statusMessageMap: { [key: string]: string } = {};

  private _statusColorMap: { [key: string]: string } = {
    Pending: 'info',
    Open: 'info',
    InProgress: 'info',
    Approved: 'success',
    Closed: 'success',
    Returned: 'success',
    Delayed: 'danger',
    MissingPayments: 'danger',
    WaitingPayment: 'warning',
    default: 'secondary',
  };

  ngOnInit(): void {
    this.initializeMessages();
  }

  get statusIcon(): string {
    return (
      this._statusIconMap[this.status || ''] || this._statusIconMap['default']
    );
  }

  get statusColor(): string {
    return (
      this._statusColorMap[this.status || ''] || this._statusColorMap['default']
    );
  }

  get statusMessage(): string {
    return this._statusMessageMap[this.status || ''] || this.status || '';
  }

  private initializeMessages(): void {
    this._statusMessageMap = {
      Approved: `Excelente! ${this.entity} concluído`,
      Closed: `Excelente! ${this.entity} concluído`,
      Returned: `Excelente! ${this.entity} concluído`,
      Pending: `Atenção: ${this.entity} em aberto`,
      Open: `Atenção: ${this.entity} em aberto`,
      WaitingPayment: `Atenção: ${this.entity} aguardando pagamento`,
      InProgress: `Atenção: ${this.entity} em andamento`,
      Delayed: `Urgente: ${this.entity} atrasado`,
      MissingPayments: `Urgente: Total do Pedido é superior à soma dos pagamentos cadastrados na transação. Adicione novos pagamentos ou ajuste os existentes para resolver essa pendência.`,
    };

    if (this.entity === 'Transação') {
      this._statusMessageMap = {
        ...this._statusMessageMap,
        Approved: `Excelente! ${this.entity} concluída`,
        Closed: `Excelente! ${this.entity} concluída`,
        Returned: `Excelente! ${this.entity} concluída`,
        Delayed: `Urgente: ${this.entity} atrasada`,
      };
    }
  }
}
