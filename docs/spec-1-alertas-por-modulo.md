# Spec 1 — Alertas de notificação seguindo o controle de módulos

> Primeira de um lote de 4 specs isoladas (3 features + 1 ajuste); esta é o ajuste. Cada spec do
> lote é implementada e validada separadamente.
>
> **Implementado.** Revisão pós-implementação: a seção 2.1 foi ajustada a pedido do usuário para
> deixar explícito que a aba "por grupo" reaproveita os switches de grupo já existentes (nenhum
> toggle novo entra ali) — o design final e o código batem com o texto abaixo.

## 1. Contexto

O controle de módulos (`docs/feature-toggle-design.md`, seção 3) já esconde menus e bloqueia
rotas quando um módulo é desligado. O que ficou de fora: os **4 sinos de alerta da navbar**
continuam aparecendo sempre, com dados carregados normalmente, mesmo com o módulo dono daquele
dado desligado.

Levantamento completo (nenhum alerta hoje checa `FeatureFlagService` nem tem qualquer `*ngIf` de
módulo — só o `*ngIf="user$ | async as user"` genérico de "está logado"):

| Alerta | Componente | Fonte de dado | Módulo (confirmado com o usuário) |
|---|---|---|---|
| CNH de motorista a vencer | `DriverLicenseNotificationComponent` | `DriverService.getExpiringLicenses()` | **FleetModule** |
| Veículos bloqueados | `VehicleBlockedNotificationComponent` | `VehicleService.getAll()` filtrado por `Blocked` | **FleetModule** |
| Itens de pedido em atraso/andamento | `OrderProductNotificationComponent` | `OrderProductService.getDelayed()` | **SalesOrdersModule** |
| Pagamentos atrasados/pendentes | `PaymentNotificationComponent` | `PaymentService.getDelayed()` | **FinanceModule** |

Todos os 4 vivem em `TSI.Friday.UIApp/src/app/navbar/components/`, montados direto em
`navbar.component.html` (linhas 25, 30, 34, 37).

**Fora de escopo desta spec**: o card "Devoluções em Atraso" do dashboard (Home) é o mesmo domínio
do alerta de itens de pedido, mas vem de uma lista dinâmica gerada pelo backend
(`Dashboard/getInfoCards`), não de um componente fixo — esconder ele exige mudança no backend, não
só de template. Combinado explicitamente: fica pra depois, resolvido de outra forma.

## 2. Desenho

### 2.1 Reaproveita os toggles de grupo já existentes + 1 toggle de entidade novo por alerta

Confirmado com o usuário: **nenhum toggle novo é criado na aba "por grupo"** — o desligamento em
cascata continua vindo dos switches de grupo que já existem lá hoje (`FleetModule`,
`SalesOrdersModule`, `FinanceModule`). Nada muda nessa aba.

O que é novo é, exclusivamente, **um toggle de entidade por alerta**, seguindo o mesmo padrão já
usado no `RentalReport` (commit `f345ae3`) — em vez de reaproveitar `Driver`/`Vehicle`/
`OrderProduct`/`Payment`. Motivo: esses toggles de entidade já controlam a exibição dos registros
em todo o sistema (telas de cadastro, grids, etc.) — reaproveitar significaria que desligar o
alerta de CNH, por exemplo, também esconderia a tela de Motoristas inteira. São preocupações
diferentes.

Cada um desses toggles novos entra com `GroupKey` apontando pro grupo já existente
(`FleetModule`/`SalesOrdersModule`/`FinanceModule`), então ele **aparece automaticamente vinculado
ao grupo certo na aba "detalhada"** (mesmo mecanismo de listagem por `GroupKey` que já existe pra
qualquer outra entidade) — é esse vínculo que atende ao "alertas individuais devem aparecer
vinculado aos grupos informados também na área detalhada".

Isso também atende ao pedido de granularidade: cada alerta pode ser desligado **individualmente**
(ex.: silenciar só o alerta de veículos bloqueados, mantendo o de CNH ligado), além de sumir
automaticamente quando o grupo inteiro (Frota, Pedidos de Venda, Financeiro) for desligado — a
regra "grupo E entidade" aplicada em todo o resto do sistema.

### 2.2 Novos `FeatureToggleKeys`

```csharp
// --- Entidades (Fleet/Viagens group) ---
public const string DriverLicenseAlert = "DriverLicenseAlert";
public const string VehicleBlockedAlert = "VehicleBlockedAlert";

// --- Entidades (Pedidos de Venda group) ---
public const string OrderProductAlert = "OrderProductAlert";

// --- Entidades (Financeiro/Relatórios group) ---
public const string PaymentAlert = "PaymentAlert";
```

Seed (`DatabaseSeeder.cs`, mesmo array `featureToggles`, mesma trava de "só cria se não existir"):

| Key | Name | GroupKey |
|---|---|---|
| `DriverLicenseAlert` | "Alerta de CNH a Vencer" | `FleetModule` |
| `VehicleBlockedAlert` | "Alerta de Veículos Bloqueados" | `FleetModule` |
| `OrderProductAlert` | "Alerta de Itens de Pedido em Atraso" | `SalesOrdersModule` |
| `PaymentAlert` | "Alerta de Pagamentos" | `FinanceModule` |

Aparecem automaticamente nas duas abas do painel de Módulos: na "por grupo" já ficam sob o
switch existente do grupo (cascata, sem precisar de nada extra); na "detalhada" cada um vira uma
linha própria dentro da sua seção — exatamente o "mais uma opção pro alerta no grupo desejado"
pedido.

### 2.3 Frontend: mesma regra "grupo E entidade" já usada no `RentalReport`

`FeatureToggleKeys` (frontend, `core/models/feature-toggle.model.ts`) ganha as 4 chaves novas.

Cada um dos 4 componentes de notificação ganha a mesma checagem dupla (via `combineLatest`, igual
ao que já foi feito em `sidebar.component.ts` pro `RentalReport`):

```ts
// Exemplo: DriverLicenseNotificationComponent
combineLatest([
  this.featureFlagService.isEnabled(FeatureToggleKeys.FleetModule),
  this.featureFlagService.isEnabled(FeatureToggleKeys.DriverLicenseAlert),
]).subscribe(([groupEnabled, alertEnabled]) => {
  this.isAlertEnabled = groupEnabled && alertEnabled;
});
```

`navbar.component.html` passa a envolver cada sino num `*ngIf` correspondente:

```html
<li class="nav-item dropdown" *ngIf="isOrderProductAlertEnabled">
  <app-order-product-notification></app-order-product-notification>
</li>
<li class="nav-item dropdown" *ngIf="isPaymentAlertEnabled">
  <app-payment-notification></app-payment-notification>
</li>
<li class="nav-item dropdown" *ngIf="isVehicleBlockedAlertEnabled">
  <app-vehicle-blocked-notification></app-vehicle-blocked-notification>
</li>
<li class="nav-item dropdown" *ngIf="isDriverLicenseAlertEnabled">
  <app-driver-license-notification></app-driver-license-notification>
</li>
```

Decisão de onde fica a checagem: no próprio `NavbarComponent` (não dentro de cada componente de
notificação individual), porque é ele quem já teria que expor os 4 booleans pro template — evita
espalhar 4 assinaturas quase idênticas em 4 arquivos diferentes só pra decidir "mostro ou não".
Cada `*NotificationComponent` continua responsável só pelos próprios dados, sem saber nada sobre
toggle.

### 2.4 Sem mudança de backend além do seed

Esses alertas não filtram dado nenhum via API (são só uma leitura direta de endpoints já
existentes, feita no próprio componente) — a única mudança de backend é a entrada no seed. Não
precisa de migration.

## 3. Fora de escopo (confirmado)

- Card "Devoluções em Atraso" do dashboard — fica pra outra spec futura, resolvido no backend.
- Nenhum guard de rota — os 4 alertas não são rotas, são widgets dentro da navbar.

## 4. Arquivos a alterar

**Backend:**
- `TSI.Friday.Contracts/src/TSI.Friday.Contracts/Models/FeatureToggleKeys.cs`
- `TSI.Friday.Data/src/TSI.Friday.Data/DatabaseSeeder.cs`

**Frontend:**
- `TSI.Friday.UIApp/src/app/core/models/feature-toggle.model.ts`
- `TSI.Friday.UIApp/src/app/navbar/navbar.component.ts`
- `TSI.Friday.UIApp/src/app/navbar/navbar.component.html`

## 5. Verificação

1. `dotnet build` (backend) + `ng build --configuration development` (frontend), zero erro.
2. Painel de Módulos → aba detalhada: confirmar as 4 novas linhas aparecendo nas seções certas
   (Frota, Pedidos de Venda, Financeiro).
3. Desligar cada alerta individualmente (grupo ligado, só o alerta desligado) → sino
   correspondente some da navbar, os outros 3 continuam normais.
4. Desligar um grupo inteiro (ex.: Frota) → os 2 alertas daquele grupo (CNH + Veículos bloqueados)
   somem juntos, mesmo com os toggles individuais deles ligados.
5. Religar tudo → os 4 sinos voltam a aparecer normalmente, com os dados de sempre.
