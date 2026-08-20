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
2. `prune-ng-modules` — remove `NgModule`s que ficaram vazios/redundantes depois do passo 1.
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
O schematic tem um **terceiro modo, `standalone-bootstrap`** (confirmado presente na versão
instalada, `node_modules/@angular/core/schematics/ng-generate/standalone-migration/schema.json`),
que automatiza a maior parte desta fase sozinho: converte `bootstrapModule` pra
`bootstrapApplication` em `main.ts` e gera `app.config.ts` a partir dos `providers` que hoje estão
em `AppModule`. Roda por último, depois que Fases 1–3 já deixaram tudo abaixo dele standalone:
```bash
npx ng generate @angular/core:standalone
# escolhe: "3) Bootstrap the application using standalone APIs"
```
Sobra manual só o que o schematic não resolve:
- `AppRoutingModule` → `app.routes.ts` (mesmo processo manual da seção "Rotas" acima).
- Módulos root que não têm `provide*()` óbvio: `ngx-toastr` precisa checar se a versão instalada
  (`^19.1.0`) expõe `provideToastr(...)` — se não expuser, fica como o único `NgModule` residual
  do app até a lib atualizar (não bloqueia o resto, é uma sobra isolada).
- Revisar o `app.config.ts` gerado: o schematic monta a partir do que está em `AppModule.providers`
  hoje, mas vale conferir se `providePrimeNG({...})` (bloco grande, com tradução pt-BR) e os dois
  `HTTP_INTERCEPTORS` (`JwtInterceptor`, `ErrorInterceptor`) vieram intactos.

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

## 9. Passo a passo prático (execução manual, sem IA)

Guia direto, pra seguir sozinho se decidir tocar a migração fora de uma sessão comigo. Repete o
ciclo abaixo **uma vez por fase** (Fase 0 → Fase 1 → Fase 2 → cada item da Fase 3, na ordem já
definida na seção 5 → Fase 4 → Fase 5), nunca pulando etapa de verificação.

### Preparação (uma vez só, antes da primeira fase)

```bash
git checkout -b feat/standalone-migration
npx ng version                      # confirma que bate com @angular/core 21.2.2 do projeto
npx ng build --configuration development   # baseline: build limpo antes de mexer em qualquer coisa
```

Sempre `npx ng`, nunca uma CLI global — garante que roda a versão instalada no projeto.

### Ciclo por fase

1. **Converter** (modo interativo ou direto por flag, restringindo ao diretório da fase):
   ```bash
   npx ng generate @angular/core:standalone
   # escolhe: "1) Convert all components, directives and pipes to standalone"
   # caminho: src/app/<diretório-da-fase>   (ex.: src/app/alert-configs)
   ```
   O schematic também edita qualquer outro `NgModule` do app que importe algo desse diretório
   (move do array `declarations` pro `imports`) — é esperado, não é escopo vazando.

2. **Podar módulos vazios** (mesmo caminho):
   ```bash
   npx ng generate @angular/core:standalone
   # escolhe: "2) Remove unnecessary NgModule classes"
   ```

3. **Revisar o diff antes de buildar.** Dois pontos que o schematic não resolve sozinho:
   - Import que o template usa mas o schematic não detectou (geralmente diretiva de terceiro
     usada só condicionalmente).
   - `*-routing.module.ts` **não vira `*.routes.ts` automaticamente** — isso é manual, ver abaixo.

4. **Build limpo:**
   ```bash
   npx ng build --configuration development
   ```
   Zero erros antes de seguir — se der erro de template (não só de tipo), o `tsc --noEmit` sozinho
   não pega, precisa ser o `ng build` completo.

5. **Teste manual de verdade.** Suba o app (`npx ng serve` + backend) e navegue por toda tela do
   diretório migrado. Build limpo **não** garante renderização — foi exatamente esse o sintoma do
   bug do `DriverDetailsModalComponent` documentado na seção 6, zero erro no console.

6. **Specs da fase** (ver subseção própria abaixo).

7. **Commit isolado, PR pequeno:**
   ```bash
   git add -A
   git commit -m "Standalone: migrate <diretório-da-fase>"
   ```
   Revisar e mergear antes de começar a próxima fase — mantém cada passo revertível sozinho
   (`git revert` de uma fase não deveria nunca precisar tocar em outra).

### Rotas: `*-routing.module.ts` → `*.routes.ts` (manual)

Pra cada módulo de rota dentro do diretório da fase:

1. Criar `x.routes.ts` com o mesmo array `Routes` que hoje está dentro de
   `RouterModule.forChild(routes)`, exportado direto:
   ```ts
   export const ALERT_CONFIGS_ROUTES: Routes = [ /* ...mesmo array de hoje... */ ];
   ```
2. No arquivo que faz `loadChildren` pra esse módulo (hoje em `app-routing.module.ts`, depois da
   Fase 4 em `app.routes.ts`), trocar:
   ```ts
   loadChildren: () => import('./alert-configs/alert-configs.module').then(m => m.AlertConfigsModule)
   ```
   por:
   ```ts
   loadChildren: () => import('./alert-configs/alert-configs.routes').then(m => m.ALERT_CONFIGS_ROUTES)
   ```
3. Apagar o `*-routing.module.ts` antigo.

### Specs da fase

Todo `TestBed.configureTestingModule({ declarations: [X] })` vira `{ imports: [X] }` assim que `X`
fica standalone — colocar standalone em `declarations` quebra o teste. Localizar os specs do
diretório:
```bash
grep -rl "declarations: \[" src/app/<diretório-da-fase> --include="*.spec.ts"
```
A troca é mecânica, mas revisar cada um: confirmar que nenhum outro componente auxiliar
referenciado no mesmo `TestBed` ainda está fora do que já foi convertido nessa fase.

### Fase 4 (root), passo a passo

1. Criar `src/app/app.config.ts` juntando os providers que hoje estão em `AppModule.providers` +
   os módulos root que têm equivalente `provide*()`:
   ```ts
   export const appConfig: ApplicationConfig = {
     providers: [
       provideZoneChangeDetection({ eventCoalescing: true }),
       provideRouter(routes),
       provideHttpClient(withInterceptorsFromDi()),
       provideAnimations(),
       providePrimeNG({ /* mesmo bloco de hoje */ }),
       provideNgxMask(),
       { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
       { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
       provideServiceWorker('ngsw-worker.js', { /* mesmas opções de hoje */ }),
     ],
   };
   ```
2. `main.ts` vira:
   ```ts
   bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
   ```
3. `app-routing.module.ts` vira `app.routes.ts` (mesmo array `routes`, sem o `@NgModule` em volta).
4. Conferir se a versão instalada de `ngx-toastr` (`^19.1.0`) expõe `provideToastr(...)`. Se não
   expuser ainda, deixar `ToastrModule.forRoot(...)` como o único `NgModule` residual por enquanto
   — não bloqueia o resto, é só uma sobra isolada pra revisitar quando a lib atualizar.

### Checklist rápido a cada fase

- [ ] `npx ng build --configuration development` sem erro
- [ ] `npx ng serve` + navegação manual em toda tela do diretório migrado
- [ ] Specs do diretório passam
- [ ] Smoke test rápido no menu lateral inteiro (o schematic mexe em módulos fora do diretório
      também, por isso vale conferir o resto do app, não só a fase em si)
- [ ] Commit isolado, PR revisado, merge antes da próxima fase
