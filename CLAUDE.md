# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

Sistema de gestão comercial (ERP enxuto), fluxo **orçamento → pedido → transação → pagamento**,
mais cadastro de clientes/fornecedores, catálogo de produtos, controle de inadimplência,
relatórios, frota/viagens e templates de documento (PDF). Multi-tenant por branch: `main` é a base
genérica; `serodioturismo` é o fork customizado para um cliente específico (Serodio, locação de
caçambas + turismo) — branches de cliente divergem de `main` e não devem ser confundidos entre si.

**Stack**: .NET 8 / ASP.NET Core Web API + EF Core (MySQL) + ASP.NET Identity/JWT + AutoMapper no
backend; Angular 21 (standalone components, sem `NgModule`) + RxJS + Bootstrap/PrimeNG/Angular
Material/AdminLTE + ag-Grid + ApexCharts no frontend.

## Comandos

**Backend** (a partir da raiz do repo):
```bash
dotnet build TSI.Friday.sln                 # build completo (todas as camadas)
dotnet test                                  # todos os testes (xUnit/Moq/FluentAssertions)
dotnet test --filter "FullyQualifiedName~TripServiceTests"   # uma classe de teste
dotnet test --filter "FullyQualifiedName~TripService_Add_ShouldAddTripSuccessfully_WhenMethodIsCalledWithAValidObject"  # um teste
dotnet test TSI.Friday.Services/tests/TSI.Friday.Services.Tests   # só um projeto de teste
```
Projetos de teste (um por camada): `TSI.Friday.Contracts.Tests`, `TSI.Friday.Data.Tests`,
`TSI.Friday.Repository.Tests`, `TSI.Friday.Services.Tests`, `TSI.Friday.IoC.Tests`,
`TSI.Friday.WebAPI.Tests`.

```bash
cd TSI.Friday.WebAPI/src/TSI.Friday.WebAPI
dotnet ef database update    # aplica migrations no MySQL configurado
dotnet run
```

**Frontend** (a partir de `TSI.Friday.UIApp/`):
```bash
npm start                              # ng serve
npm run build                          # build produção + replace-index-href
npm run watch                          # build watch, configuração development
npm test                               # Karma/Jasmine
npx ng test --include='**/trip.service.spec.ts'   # um spec só
```
Sempre `npx ng ...` (nunca uma CLI global) para garantir a versão do projeto. Não há linter
(ESLint) configurado.

Credenciais/segredos **nunca** vão para `appsettings.json`/`appsettings.Development.json` —
sempre via variável de ambiente, `dotnet user-secrets`, ou `appsettings.Local.json` (gitignored,
copiar de `appsettings.Local.json.example`). Ver README.md para a tabela completa de
variáveis/secrets e o processo de deploy manual via FTP/IIS.

## Arquitetura do backend

Camadas como projetos .NET separados, dependência em uma direção só:
```
WebAPI → IoC → Services → Repository → Data → Contracts
```
- **Contracts**: modelos, DTOs, enums, interfaces — sem dependências de outras camadas.
- **Data**: `DbContext` (EF Core), interceptors (auditoria, ajuste automático de estoque),
  migrations, seed (`DatabaseSeeder.cs` roda sempre e só insere o que não existe; `DemoDataSeeder`
  é opcional via flag `SeedDemoData`, só roda em banco vazio e fora de `Production`).
- **Repository**: repositório genérico `Repository<T>` sobre o `DbContext`.
- **Services**: regra de negócio, um serviço por domínio.
- **IoC**: DI + AutoMapper (`MappingProfile.cs`).
- **WebAPI**: controllers REST, JWT, Swagger (dev).

### Sistema de feature toggles (módulos)

Tabela `FeatureToggle` (`Key`, `Name`, `Description`, `GroupKey` nullable, `Enabled`). Dois tipos
de chave, ambos em `FeatureToggleKeys.cs` (`TSI.Friday.Contracts`):
- **Group keys** (`GroupKey = null`): os 5 módulos top-level — `FleetModule`, `FinanceModule`,
  `QuotesModule`, `SalesOrdersModule`, `AttachmentsModule`.
- **Entity keys** (`GroupKey` = a chave do grupo dono): controle fino dentro de um módulo.

**Regra central, documentada no próprio arquivo**: um registro só é exibido quando **tanto** o
toggle de entidade **quanto** o de grupo estiverem ligados (`combineLatest([group, entity])` no
frontend). Ao adicionar uma nova entidade/tela/alerta gateável, o padrão é: nova chave em
`FeatureToggleKeys.cs` (dupla — C# e o espelho TS em `core/models/feature-toggle.model.ts`), seed
em `DatabaseSeeder.cs` com o `GroupKey` correto, checagem `combineLatest` no componente Angular
(ver `RentalReport` em `sidebar.component.ts` ou os alertas de navbar em `navbar.component.ts`
como referência). Preferir um toggle **dedicado e de escopo estreito** por novo elemento de UI em
vez de reaproveitar um toggle de entidade já existente com efeito colateral em outras telas — ver
`docs/spec-1-alertas-por-modulo.md`, seção 2.1, para o raciocínio completo por trás dessa escolha.

Painel admin (`feature-toggles` feature, Master-only) tem duas visões sobre os mesmos dados: "por
grupo" lista só os 5 toggles de grupo; "detalhada" agrupa os toggles de entidade sob o grupo dono
(`groupKey === group.key`), com o switch desabilitado se o grupo estiver desligado.

Desenho completo em `docs/feature-toggle-design.md`.

## Arquitetura do frontend

`TSI.Friday.UIApp/src/app` — **100% standalone components**, sem `NgModule` (bootstrap via
`app.config.ts` + `bootstrapApplication`, rotas via `app.routes.ts` com `loadChildren` apontando
para `*.routes.ts` por feature, não para módulos). Um `*-shared.module.ts`/`.module.ts` residual
ainda aparece em alguns diretórios (`orders`, `trips`, `business-partner`, `order-products`, etc.)
— são cascas vazias (`declarations: []`) que sobraram da migração, não recriar esse padrão em
código novo; todo componente novo é standalone e declara seus próprios `imports: [...]`.

- **`core/`**: guards (`AuthorizationGuard` — `CanActivateChild`, lê `route.data['roles']` e
  `route.data['featureFlag']`, este último aceitando `string | string[]`, com `.every()` sobre
  `FeatureFlagService.isEnabled()`), interceptors (JWT, erro), serviços de API, modelos/enums
  compartilhados, i18n, pipes/diretivas (`ClickDirective`/`appClick`, `TranslatePipe`,
  `CurrencyFormatDirective`).
- **`shared/`**: componentes reaproveitados entre features (`app-date-field`, `app-currency-field`,
  `app-grid` sobre ag-Grid, `app-photo`, etc.) — importados diretamente por quem usa, não via
  barrel module.
- Cada feature de domínio (`orders`, `quotes`, `trips`, `payments`, `business-partner`, `products`,
  `vehicles`, `users`, `reports`, `feature-toggles`, `document-templates`, ...) é lazy-loaded via
  `loadChildren`/`loadComponent` em `app.routes.ts`, cada uma com seu próprio `*.routes.ts`.
- **i18n**: `TranslatePipe` + `TranslationService`, pt-BR/en/es.
- **Tema**: dark/light mode, preferência persistida em `User.theme`.

### Convenções recorrentes desta sessão

- Filtro de intervalo de datas em relatórios: área de filtro escondida por padrão, animação
  `cardCollapseAnimation` ao abrir/fechar (ver `order-products` "Relatório Locações" e
  `fleet-report`).
- Estado de loading em botões de submit (ex.: login): a desabilitação funcional já costuma vir de
  `ClickDirective`/`appClick` — ao reportar um botão "não parece desabilitado", checar primeiro se
  falta só o estilo `:disabled` no CSS, não a lógica.
- Alertas de notificação da navbar (`navbar/components/*-notification`) cada um busca seus próprios
  dados sem serviço compartilhado; a visibilidade de cada sino é centralizada em
  `NavbarComponent` (não duplicada dentro de cada componente de notificação), seguindo a mesma
  regra grupo+entidade dos feature toggles.

## Fluxo de trabalho de specs

Mudanças maiores/específicas de cliente passam por um doc em `docs/spec-N-*.md` ou
`docs/*-design.md` **antes** do código: contexto, desenho, arquivos a alterar, verificação. Specs
existentes documentam decisões já tomadas (`feature-toggle-design.md`,
`standalone-migration-design.md`, `document-templates-design.md`, `ajustes-pos-deploy-serodio.md`)
— consultar antes de redesenhar algo que já foi decidido, e checar se a doc já tem uma seção
"Implementado" antes de assumir que é só um plano. **Não implementar uma spec nova sem o "ok"
explícito do usuário sobre o desenho escrito** — só codar depois da validação, mesmo que a
próxima mensagem pareça confirmar o design.
