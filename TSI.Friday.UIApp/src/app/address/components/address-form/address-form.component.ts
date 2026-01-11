import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import {
  Address,
  FormBaseComponent,
  NotificationService,
  ResponseStatus,
} from '@friday/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-address-form',
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.scss',
  standalone: false,
})
export class AddressFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  private cidadesCancel$ = new Subject<void>();
  @Input()
  isEdit = false;

  @Input()
  data?: Address | null;

  @Input()
  compact = false;

  @Input()
  errors: string[] | undefined;

  @Output()
  save = new EventEmitter<Address>();

  @Output()
  cancel = new EventEmitter<void>();

  estados: { id: number; sigla: string; nome: string }[] = [];
  cidades: { id: number; nome: string }[] = [];
  loadingCep = false;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.getEstados();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue && this.form) {
      this.form.patchValue(changes['data'].currentValue);
    }
    if (changes['isEdit'] && !changes['isEdit'].firstChange) {
      if (this.isEdit) {
        this.form.get('id')?.disable();
        this.form.get('clientId')?.disable();
      }
    }
  }

  private initForm(): void {
    const commonControls = {
      type: [null, Validators.required],
      zipCode: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      street: ['', Validators.required],
      number: [null, Validators.required],
      comments: [''],
      clientId: [''],
      country: ['BR', Validators.required],
    };

    this.form = !this.isEdit
      ? this.formBuilder.group({
          ...commonControls,
        })
      : this.formBuilder.group({
          id: [''],
          ...commonControls,
        });

    if (this.isEdit) {
      this.form.get('id')?.disable();
    }

    if (this.data) {
      // Normaliza type para number/null
      const patch = { ...this.data };
      if (patch.type !== null && patch.type !== undefined) {
        patch.type = patch.type;
      }
      // Aguarda estados carregarem antes de carregar cidades
      const patchAndLoadCities = () => {
        this.form.patchValue(patch);
        if (patch.state) {
          const estado = this.estados.find((e) => e.sigla === patch.state);
          if (estado) {
            this.http
              .get<any[]>(
                `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado.id}/municipios`
              )
              .subscribe((cidades) => {
                this.cidades = cidades || [];
                const normalize = (str: string) =>
                  str
                    .normalize('NFD')
                    .replace(/\p{Diacritic}/gu, '')
                    .toLowerCase();
                let cidadeFinal = '';
                const cityValue = patch.city ?? '';
                // Busca cidade ignorando acentos e caixa
                const cidadeMatch = this.cidades.find(
                  (c) => normalize(c.nome) === normalize(cityValue)
                );
                if (cidadeMatch) {
                  cidadeFinal = cidadeMatch.nome;
                } else if (this.cidades.length > 0) {
                  cidadeFinal = this.cidades[0].nome;
                }
                this.form.get('city')?.setValue(cidadeFinal);
                this.form.get('city')?.updateValueAndValidity();
                this.form.updateValueAndValidity();
              });
          }
        }
      };
      if (this.estados && this.estados.length > 0) {
        patchAndLoadCities();
      } else {
        // Aguarda estados serem carregados
        const estadosSub = this.http
          .get<any[]>(
            'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
          )
          .subscribe((estados) => {
            this.estados = estados;
            patchAndLoadCities();
            estadosSub.unsubscribe();
          });
      }
    }

    this.form.get('zipCode')?.valueChanges.subscribe((cep: string) => {
      if (cep && cep.length >= 8) {
        this.buscarEnderecoPorCep(cep);
      }
    });

    this.form
      .get('state')
      ?.valueChanges.pipe(
        takeUntil(this.cidadesCancel$),
        switchMap((sigla: string) => {
          if (!sigla) {
            this.cidades = [];
            this.form.get('city')?.setValue('');
            return of([]);
          }
          const estado = this.estados.find((e) => e.sigla === sigla);
          if (!estado) {
            this.cidades = [];
            this.form.get('city')?.setValue('');
            return of([]);
          }
          return this.http.get<any[]>(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado.id}/municipios`
          );
        })
      )
      .subscribe((cidades) => {
        this.cidades = cidades || [];
        let cidadeFinal = '';
        const cityControl = this.form.get('city');
        const normalize = (str: string) =>
          str
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase();
        // Se o valor atual existe na lista, mantém
        if (
          cityControl?.value &&
          this.cidades.some(
            (c) => normalize(c.nome) === normalize(cityControl.value)
          )
        ) {
          cidadeFinal = cityControl.value;
        } else if (this.cidades.length > 0) {
          cidadeFinal = this.cidades[0].nome;
        }
        cityControl?.setValue(cidadeFinal);
        cityControl?.setValidators([Validators.required]);
        cityControl?.updateValueAndValidity();
        this.form.updateValueAndValidity();
      });
  }

  getEstados() {
    this.http
      .get<any[]>(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
      )
      .subscribe((estados) => {
        this.estados = estados;
      });
  }

  buscarEnderecoPorCep(cep: string) {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    this.loadingCep = true;
    this.http.get<any>(`https://viacep.com.br/ws/${cepLimpo}/json/`).subscribe({
      next: (res) => {
        if (!res.erro) {
          this.form.patchValue({
            street: res.logradouro || '',
            state: res.uf || '',
          });
          // Aguarda o subscribe do state para preencher cidade
          setTimeout(() => {
            const cityControl = this.form.get('city');
            const normalize = (str: string) =>
              str
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '')
                .toLowerCase();
            let cidadeFinal = '';
            if (res.localidade && this.cidades.length > 0) {
              const cidadeMatch = this.cidades.find(
                (c) => normalize(c.nome) === normalize(res.localidade)
              );
              if (cidadeMatch) cidadeFinal = cidadeMatch.nome;
            }
            if (!cidadeFinal && this.cidades.length > 0) {
              cidadeFinal = this.cidades[0].nome;
            }
            cityControl?.setValue(cidadeFinal);
            cityControl?.updateValueAndValidity();
            this.form.updateValueAndValidity();
          }, 100);
        } else {
          this.notificationService.showMessage(
            ResponseStatus.Error,
            'CEP não encontrado: O CEP informado não foi localizado.'
          );
        }
      },
      error: () => {
        this.notificationService.showMessage(
          ResponseStatus.Error,
          'Erro ao buscar CEP: Não foi possível consultar o CEP.'
        );
      },
      complete: () => {
        this.loadingCep = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue() as Address);
  }

  doCancel(): void {
    this.cancel.emit();
  }
}
