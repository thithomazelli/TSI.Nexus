# Migração de NgModules para Standalone Components — mapeamento e spec

> Escrito antes de qualquer código ser tocado, a partir de um levantamento real do repositório
> (`serodioturismo`, Angular 21.2.2). Serve de referência pra decidir escopo/ordem antes de
> começar, não é um "vale tudo" — cada fase abaixo deve ser um PR pequeno e testável sozinho.

## 1. Objetivo

Hoje o app inteiro é montado em cima de `NgModule` (`AppModule` + ~49 módulos de feature/roteamento/
compartilhamento). A proposta é migrar para **standalone components** em todo o app: cada
componente/diretiva/pipe declara suas próprias dependências (`imports: [...]` no próprio
`@Component`), sem `NgModule` nenhum no meio, `bootstrapApplication` no lugar de
`bootstrapModule`, e rotas com `loadComponent`/`provideRouter` no lugar de `loadChildren` +
`RouterModule.forChild`.

Motivação prática, não só "seguir a tendência do Angular":

- **Elimina uma classe de bug que já aconteceu neste projeto.** O grafo de módulos hoje tem
  import cruzado entre features (`OrdersModule` importa `ProductsModule` e `PaymentsModule`
  inteiros; `TripsSharedModule` importa `DriversSharedModule`) — foi exatamente esse tipo de ciclo
  que causou o bug documentado de esbuild fazendo code-splitting de `DriverDetailsModalComponent`
  num chunk separado sem escopo de componente Ivy aplicado (`ɵɵsetComponentScope()` nunca rodava
  pra aquela cópia), fazendo `<app-driver-form>` renderizar como elemento inerte sem nenhum erro
  no console. Sem `NgModule`, não existe mais "declarar num módulo e exportar por outro" — cada
  componente importa exatamente o que usa, então esse tipo de ciclo estrutural não tem mais como
  se formar.
- **Os 8 arquivos `*-shared.module.ts`** (`orders-`, `trips-`, `drivers-`, `business-partner-`,
  `transactions-`, `quotes-`, `quote-products-`, `order-products-shared.module.ts`) existem **só**
  pra resolver esse problema de ciclo — não representam nenhum agrupamento funcional real. Eles
  somem inteiramente na migração.
- Bundles menores por rota (cada componente convertido só carrega quem de fato importa, sem
  arrastar módulo inteiro) e builds incrementais mais rápidos — ganho real, mas secundário aqui.

## 2. Levantamento do estado atual

| Item | Quantidade |
|---|---|
| Arquivos `*.module.ts` | 49 |
| Componentes (`@Component`), todos `standalone: false` hoje | 101 |
| Pipes (`@Pipe`) | 1 (`TranslatePipe` — já sem `standalone: false`, ver seção 4) |
| Diretivas (`@Directive`) | 2 (`ClickDirective`, `CurrencyFormatDirective` — idem) |
| Guards | 1 (`AuthorizationGuard`, já `@Injectable({providedIn:'root'})`, classe) |
| Interceptors | 2 (`JwtInterceptor`, `ErrorInterceptor`) |
| Arquivos `*.spec.ts` | 84 — todos no padrão antigo `TestBed.configureTestingModule({ declarations: [...] })` |
| Rotas lazy (`loadChildren`) no root | 21, uma por feature module |
| Módulos `*-shared.module.ts` (só pra quebrar ciclo entre features) | 8 |

**Builder já é o moderno**: `angular.json` usa `@angular/build:application` (esbuild) — não tem
nenhuma troca de builder pra fazer, só o código.

**Bootstrap atual** (`main.ts`): `platformBrowserDynamic().bootstrapModule(AppModule, {...})`.

**Providers hoje já estão no formato `provide*()`** (bom sinal, menos trabalho): `provideHttpClient`,
`providePrimeNG`, `provideNgxMask`. O que ainda é `NgModule`-only no root: `BrowserModule`,
`BrowserAnimationsModule`, `FormsModule`, `ToastrModule.forRoot(...)`, `ServiceWorkerModule.register(...)`,
mais `NavbarModule` e `SharedModule` inteiros.

**`ModalService`** abre tudo via `MatDialog.open(ComponentClass, {...})` — API que já funciona
igual para componente standalone ou declarado em módulo (não usa `ComponentFactoryResolver` nem
`entryComponents`). **Não é um bloqueador** — dá pra converter os componentes abertos em modal sem
mexer no `ModalService`.

## 3. O que muda, conceitualmente

| Hoje (NgModule) | Depois (standalone) |
|---|---|
| `@Component({ standalone: false })` + declarado em algum `NgModule` | `@Component({ imports: [CommonModule, ReactiveFormsModule, ...] })` (sem `standalone: false`, que já é o default) |
| `SharedModule` (declara + exporta ~15 componentes/pipes/diretivas, importa Material/PrimeNG/ag-grid) | some. Cada componente importa direto só o que usa (`DateFieldComponent`, `GridComponent` etc. viram imports normais) |
| 8x `*-shared.module.ts` (só pra evitar ciclo) | somem inteiramente |
| `AppModule` (`declarations`, `imports`, `providers`, `bootstrap`) | `app.config.ts` (`ApplicationConfig` com `providers: [...]`) + `bootstrapApplication(AppComponent, appConfig)` em `main.ts` |
| `AppRoutingModule` com `RouterModule.forRoot(routes)` | `app.routes.ts` (`Routes` puro) + `provideRouter(routes, withRouterConfig(...))` no `app.config.ts` |
| `loadChildren: () => import('./x/x.module').then(m => m.XModule)` | `loadChildren: () => import('./x/x.routes').then(m => m.X_ROUTES)` **ou** `loadComponent` direto na página, dependendo se a feature ainda precisa de sub-rotas |
| `TestBed.configureTestingModule({ declarations: [X] })` | `TestBed.configureTestingModule({ imports: [X] })` (componente standalone entra como `imports`, não `declarations`) |

`HTTP_INTERCEPTORS` (classe, `multi: true`, hoje registrado via `withInterceptorsFromDi()`) segue
funcionando sem mudança nenhuma — não precisa virar `HttpInterceptorFn` pra essa migração, é
opcional. Mesma coisa pro `AuthorizationGuard`: continua uma classe `CanActivateChild`, funciona
igual em rotas standalone.

## 4. Detalhe que facilita: parte disso já é standalone hoje

`ClickDirective`, `TranslatePipe` e `CurrencyFormatDirective` já **não têm** `standalone: false`
no decorator — ou seja, já são standalone por omissão (é o default desde que o Angular 19 mudou o
default do schematic), só que `SharedModule`/`AppModule` ainda os importam como se fossem parte de
um módulo. Confirma que a base do projeto (Angular 21.2.2) já suporta o padrão sem downgrade nem
pacote novo — é só terminar o que já começou.

## 5. Estratégia: usar o schematic oficial, em fases pequenas

O Angular tem um schematic de migração automática (`ng generate @angular/core:standalone`) com 3
modos, rodados em sequência:

1. `convert-to-standalone` — marca componentes/diretivas/pipes como standalone e resolve os
   `imports` de cada um automaticamente (lendo o que o template de cada componente de fato usa).
2. `prune-ngmodules` — remove `NgModule`s que ficaram vazios/redundantes depois do passo 1.
3. `standalone-bootstrap` — troca `bootstrapModule` por `bootstrapApplication` e gera
   `app.config.ts`.

**Não rodar os 3 de uma vez no repo inteiro.** Pelo grafo de dependência cruzada já mapeado
(seção 1) e pelo precedente real do bug de circular-dependency, o risco de um `ɵɵsetComponentScope`
mal aplicado ou um import quebrado silencioso é real — e como visto no bug do Driver, esse tipo de
erro **não aparece no console**, só em teste manual. Cada fase abaixo tem que fechar com build +
teste manual smoke antes de passar pra próxima.

### Fase 0 — preparação (sem mudança visível)
- Rodar `ng generate @angular/core:standalone` **em modo dry-run** primeiro, revisar o diff
  proposto por diretório antes de aceitar qualquer coisa.
- Escolher 1 feature pequena e isolada como piloto (candidata: `alert-configs/` ou
  `feature-toggles/` — só 1 módulo + 1 routing módulo cada, sem `*-shared.module.ts`, sem ser
  importado por nenhuma outra feature). Migrar essa primeiro, sozinha, valida o processo antes de
  tocar em algo com fan-out grande.

### Fase 1 — folhas: `shared/` (componentes reaproveitados, sem lógica de feature)
Converter os ~15 componentes de `shared/components/*` (`DateFieldComponent`, `GridComponent`,
`CurrencyFieldComponent`, `AuditTabComponent`, `LinkFieldComponent`, etc.) e as 2 diretivas + 1 pipe
pra standalone primeiro — são os que mais reaparecem em import (praticamente toda feature usa
`app-date-field`/`app-grid`), então travar esse comportamento cedo, sozinho, é o teste mais barato
possível: qualquer regressão aparece na hora em qualquer tela que abra um form.

`SharedModule` deixa de existir como módulo-barril; vira, na prática, "cada componente de feature
passa a importar `DateFieldComponent` direto" (o schematic já resolve isso sozinho no passo 2).

### Fase 2 — features "folha" (não são importadas por nenhuma outra feature)
Pela leitura do grafo hoje, os candidatos sem fan-in de outras features são: `alert-configs`,
`feature-toggles`, `document-templates`, `selectable-options`, `users`, `reports`, `account`,
`vehicles`. Migrar cada uma isoladamente, uma PR por feature.

### Fase 3 — features com fan-out conhecido (ordem importa)
Aqui está o risco real, então a ordem segue de quem-é-importado pra quem-importa:

1. `products` (importado por `orders`, `order-products`, `quote-products`)
2. `payments` (importado por `orders`, `navbar`)
3. `drivers` (importado por `trips`, via `DriversSharedModule` hoje)
4. `business-partner` (importado por `orders`, `quotes`, `trips`)
5. `transactions` (importado por `orders`, `quotes`, `trips`)
6. `order-products`, `quote-products` (dependem de `products`, já migrado)
7. `orders`, `quotes`, `trips` (os que mais importam de outras features — migrar por último,
   depois que tudo que eles dependem já está limpo)
8. `navbar` (depende de `payments` + `order-products`, ambos já migrados nesse ponto)

Nessa fase os 8 `*-shared.module.ts` somem — cada componente de `trips`, por exemplo, passa a
importar `DriverFormComponent`/`DriverService` diretamente do que precisa, sem passar por
`DriversSharedModule`.

### Fase 4 — root
- `AppModule` → `app.config.ts` (providers) + `AppComponent` standalone.
- `AppRoutingModule` → `app.routes.ts`, com `loadChildren`/`loadComponent` apontando pra
  `*.routes.ts` de cada feature (schematic gera isso a partir dos `*-routing.module.ts` atuais).
- `main.ts` → `bootstrapApplication(AppComponent, appConfig)`.
- Providers hoje presos no `AppModule` (`ToastrModule.forRoot(...)`, `ServiceWorkerModule.register(...)`,
  `BrowserAnimationsModule`) trocam pelos equivalentes `provide*()`: `provideAnimations()`,
  `provideServiceWorker(...)`; `ngx-toastr` precisa checar se a versão instalada (`^19.1.0`) expõe
  `provideToastr(...)` (a maioria das libs migrou; se não expuser, fica como último `NgModule`
  residual até a lib atualizar — não é bloqueador pro resto).

### Fase 5 — testes (84 arquivos `*.spec.ts`)
Trabalho mecânico mas obrigatório: todo `TestBed.configureTestingModule({ declarations: [X] })`
vira `{ imports: [X] })` assim que `X` fica standalone (colocar uma classe standalone em
`declarations` quebra o teste). Dá pra fazer com um codemod simples (regex/ts-morph) já que o
padrão é uniforme nos 84 arquivos, mas rodar depois de cada fase acima (não deixar acumular pro
final) — testar cada feature migrada imediatamente confirma que a fase não quebrou nada.

## 6. Riscos específicos deste projeto (não genéricos do Angular)

- **Precedente real de bug silencioso**: o esbuild/`ɵɵsetComponentScope` já mordeu esse projeto
  uma vez num cenário de import cruzado entre `trips`/`drivers`. Durante a Fase 3, testar
  manualmente (não só `ng build` limpo) cada fluxo que atravessa a fronteira migrada — build sem
  erro **não** garante que o componente renderiza (foi exatamente esse o sintoma da vez passada).
- **PrimeNG/Material já usados como standalone dentro de `SharedModule`** (`Tree`, `Dialog`,
  `Button`, `DatePicker` etc. já entram no `imports` de um `NgModule` porque já são standalone) —
  baixo risco, é só redistribuir esses imports pros componentes que de fato os usam.
- **`ngx-mask`, `providePrimeNG`, `provideHttpClient` já no formato novo** — não precisam de
  migração, só reposicionar de `AppModule.providers` pra `app.config.ts`.
- **`ngx-toastr` `.forRoot()`** é o candidato mais provável a não ter equivalente standalone
  pronto dependendo da versão exata — validar antes da Fase 4 pra não travar o resto por causa
  disso (dá pra manter só esse import de módulo isolado se precisar, sem bloquear o resto da
  migração).

## 7. Fora de escopo

- Trocar `AuthorizationGuard`/interceptors de classe pra função (`CanActivateFn`/`HttpInterceptorFn`)
  — funcionam igual como estão, é limpeza cosmética separada, não faz parte de "virar standalone".
- Nenhuma mudança de comportamento visível pro usuário em nenhuma fase — é reorganização interna,
  toda fase deve fechar com o app funcionando exatamente igual.

## 8. Próximo passo sugerido

Rodar a Fase 0 (dry-run do schematic + piloto em `alert-configs` ou `feature-toggles`) como uma PR
isolada, pequena, fácil de revisar e de reverter se algo sair errado — antes de comprometer com o
resto do plano.
