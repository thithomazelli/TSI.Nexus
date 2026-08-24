# Spec 4 — Agenda / Calendário

> Escrito antes de qualquer código ser tocado, conforme a regra do próprio `CLAUDE.md`: uma spec
> nova só é implementada depois do "ok" explícito do usuário sobre o desenho escrito, mesmo que a
> mensagem que a pediu já pareça confirmar ("Adiante!!!!!!!" foi o pedido pra escrever isto, não
> uma aprovação do desenho — o desenho ainda não existia). Este é o módulo mais amplo já
> especificado no projeto: uma entidade nova que se liga a praticamente todas as outras, um
> componente de calendário nunca antes construído aqui, e pontas em 5 áreas diferentes do sistema
> (módulo próprio, aba em N entidades, aba em Usuário, sino de navbar, painel de Alertas). Por
> isso o formato deste documento marca explicitamente **4 decisões de modelagem** que precisam de
> validação sua antes de codar — o resto é aplicação direta de padrões que já existem no código.

## 1. Contexto: o que já existe hoje e este spec reaproveita

Levantamento feito no código (não redesenho, é o que já existe):

- **`Attachment`** — o precedente mais próximo de "uma entidade ligada a muitas outras". Hoje tem
  **11 colunas FK opcionais**, uma por entidade (`BusinessPartnerId`, `QuoteId`, `OrderId`,
  `PurchaseOrderId`, `TripId`, `TransactionId`, `PaymentId`, `ProductId`, `VehicleId`,
  `DriverId`, `VehicleMaintenanceId`), mais um `UserId` (string, sem `[ForeignKey]`, inconsistente
  com as demais — não repetir esse detalhe). **Não é polimórfico** — confirmado também em
  `docs/spec-2-pedido-de-compra.md`: *"não é polimórfico... entidade nova que precise anexos ganha
  sua própria coluna + método `GetBy<Entidade>Id`"*. `AttachmentService.cs` tem um método
  `GetByXId` por entidade, todos delegando pra um `QueryAsync` privado compartilhado.
  `AttachmentsComponent` no frontend decide qual FK preencher e qual `GetByXId` chamar através de
  3 mapas paralelos por string (`entityIdField`, o mapa inline dentro de `loadAttachments()`, e
  `entityFolderKey`), indexados pelo `@Input() entity` (`'businessPartner'`, `'vehicleMaintenance'`,
  etc.) — é o padrão de "aba reaproveitável" que a Agenda replica.
- **Denormalização de FK já existe em `Transaction`/`Payment`** — isso é o que viabiliza os
  "cascades" pedidos (mostrar evento do pedido + filhos): `Order` tem `TransactionId` (1
  Transaction) e `Payments` (coleção); `Transaction` já guarda `OrderId`/`PurchaseOrderId`/
  `TripId`/`BusinessPartnerId` diretamente (nullable, denormalizado); `Payment` guarda
  `TransactionId` **e também** `OrderId`/`PurchaseOrderId`/`TripId`/`BusinessPartnerId`/`DriverId`
  diretamente. `PurchaseOrder`, `Quote` e `Trip` também têm `BusinessPartnerId` próprio. Ou seja: a
  "árvore" Cliente → Pedido → Transação → Pagamentos já é navegável por FK direta em cada nível,
  sem precisar de joins profundos — a Agenda só precisa seguir o mesmo desenho.
- **`SelectableOption`** (`Group: SelectableOptionGroup`, `Value: string`) — lista pequena
  administrável hoje com 4 grupos (`AddressType`, `ProductCategory`, `TransactionCategory`,
  `FuelLogStatus`). Tela admin genérica em `selectable-options/` já existe (`selectable-options.
  component.ts`), com um array `groups` hardcoded no componente e troca de aba por grupo — cada
  grupo novo precisa de 1 linha nesse array, não é 100% data-driven.
- **`FeatureToggle`** — regra grupo+entidade já documentada no `CLAUDE.md`: um registro só aparece
  quando o toggle de entidade **e** o de grupo estão ligados. 6 grupos hoje (`FleetModule`,
  `FinanceModule`, `QuotesModule`, `SalesOrdersModule`, `PurchaseOrdersModule`,
  `AttachmentsModule`).
- **`AlertConfig`** — mecanismo **separado** do FeatureToggle, usado pra regra de negócio (não
  visibilidade de UI): `Key`, `Enabled`, `ThresholdDays?` (nullable = só dispara já vencido).
  3 chaves hoje (`VehicleMaintenanceOverdue`, `DashboardOverdueReturns`, `DriverLicenseExpiry`).
  Painel "Configuração → Alertas" (`alert-configs/`) já lista todas as `AlertConfig` com toggle +
  campo de dias — é a tela que o pedido *"opção pra ligar/desligar esse alerta dentro da área de
  configuração/alertas"* está pedindo, não o FeatureToggle.
  **Os dois mecanismos convivem hoje** (ex.: `DriverLicenseAlert` no FeatureToggle liga/desliga o
  sino em si; `DriverLicenseExpiry` no AlertConfig configura quantos dias de antecedência) — a
  Agenda replica essa dupla exatamente.
- **Sinos de navbar** (`navbar/components/*-notification`) — cada um busca seus próprios dados
  (sem serviço compartilhado); a visibilidade é centralizada em `NavbarComponent.ts` via
  `combineLatest` dos toggles de grupo+entidade, nunca decidida dentro do próprio componente do
  sino (regra já documentada no `CLAUDE.md`).
- **`Users`** já tem página de detalhes com abas (`Dados` / `Anexos` / `Preferências` /
  `Auditoria`) no mesmo padrão `activeTab` + `@if` usado em Manutenção — a aba "Agenda" nova entra
  do lado dela.
- **`TripDriver`** — o precedente mais próximo de "join entity com payload próprio" (liga `Trip` a
  `Driver`, carrega `Amount` e um `PaymentId` de efeito colateral). É o modelo pra
  `EventParticipant`, com a diferença de que participante pode ser um `User` do sistema OU um
  contato livre (nome/e-mail) — isso não tem precedente exato no código.
- **Nenhuma biblioteca de calendário/agenda está instalada hoje.** `app-date-field`
  (`shared/components/date-field`) usa **PrimeNG `DatePicker`** — serve pra campos de data única
  (início/fim do evento), mas não é um componente de grade mensal/semanal. Construir a visão
  "calendário estilo Outlook" é território novo neste projeto (ver Decisão 1).

## 2. Decisão a validar #1 — biblioteca de calendário

Não existe hoje nenhuma dependência de calendário/scheduler no `package.json`. Pra entregar
"calendário estilo Outlook" (mês/semana/dia, clicar um evento existente, arrastar/selecionar um
intervalo pra criar um novo, evento colorido por tipo) há duas rotas:

- **Construir do zero** (grade de dias + eventos como `<div>`s posicionados) — zero dependência
  nova, mas replicar duplo-clique-pra-editar e seleção-de-intervalo-pra-criar do jeito que o
  Outlook faz é bastante código customizado, e ainda faltaria visão de semana/dia.
- **Adicionar `@fullcalendar/angular`** (+ `@fullcalendar/core`, `@fullcalendar/daygrid`,
  `@fullcalendar/timegrid`, `@fullcalendar/interaction`) — os plugins de visão mês/semana/dia/lista
  e a interação de clique/seleção são MIT (só os plugins "premium" de timeline de recursos exigem
  licença, e este spec não usa nenhum). É Angular-first, dá clique-duplo em evento
  (`eventClick`), seleção de intervalo (`select`) já prontos, e cor por evento via `eventColor`/
  `backgroundColor` — exatamente o que foi pedido.

**Recomendação: `@fullcalendar/angular` com os plugins `daygrid`+`timegrid`+`interaction`.** É a
única opção que entrega visão mês/semana/dia + duplo-clique + seleção de intervalo sem reinventar
tudo isso na mão. É uma dependência nova (proporcional ao pedido, mas ainda assim uma dependência
nova) — **preciso da sua confirmação explícita aqui antes de instalar**, já que adicionar
biblioteca não é uma decisão que costumo tomar sozinho.

## 3. Decisão a validar #2 — quais entidades entram na v1 (FKs do Event)

O pedido foi *"ligação com praticamente todas as entidades do projeto, todas as que tiverem datas
dentro dela"*. Levantamento de todo `DateTime` que não é `CreateDate`/`ModifyDate` em
`TSI.Nexus.Contracts/Models/*.cs`:

| Entidade | Campo(s) de data |
|---|---|
| `BusinessPartner` (via `Individual`) | `Birthday` |
| `Order` | `Date` |
| `PurchaseOrder` | `Date` |
| `Quote` | `Date` |
| `Trip` | `Date` |
| `Transaction` | `Date` |
| `Payment` | `Date` |
| `Vehicle`/`VehicleMaintenance` | `ScheduledDate`, `CompletedDate` |
| `Driver` | `Birthday`, `LicenseExpiryDate`, `AdmissionDate` |
| `FuelLog` | `Date` |
| `ServiceOrder` | `IssueDate`, `CompletionDate` |
| `Commission` | `PaidDate` |
| `TripLeg` | `DepartureDate`, `ArrivalDate` |

Seguir a lista inteira à risca hoje significaria ~13 FKs de saída. **Proposta pra v1: espelhar
exatamente o conjunto que `Attachment` já cobre** (`BusinessPartnerId`, `QuoteId`, `OrderId`,
`PurchaseOrderId`, `TripId`, `TransactionId`, `PaymentId`, `VehicleId`, `DriverId`,
`VehicleMaintenanceId` — 10 das 11, tirando só `ProductId`, que não tem campo de data próprio) **+
`FuelLogId`**, que você citou como exemplo mas `Attachment` ainda não cobre (gap pré-existente, não
deste spec). `ServiceOrder`, `Commission` e `TripLeg` ficam de fora da v1 — são filhos de `Trip`/
`VehicleMaintenance`, então um evento ligado ao `Trip`/`VehicleMaintenance` pai já aparece na aba
Agenda deles por cascata (seção 6.4). Adicionar qualquer uma dessas depois é mecânico: 1 coluna FK
+ 1 método `FindByXId` no serviço + 3 entradas nos mapas do componente de aba (mesma receita que
`Attachment` já usa pra crescer) — não é um redesenho, só falta escopo pra essa primeira entrega.

**Preciso да sua confirmação**: esse conjunto de 11 (10 do Attachment + FuelLog) resolve pro
primeiro momento, ou algum desses 3 de fora (ServiceOrder/Commission/TripLeg) é obrigatório já na
v1?

## 4. Decisão a validar #3 — Tipo de evento + cor

Pedido: *"tipo do evento: uma lista básica, administrável pela lista de opções do admin"* +
*"cada evento deve ser mostrado de uma cor"*. `SelectableOption` hoje é só `Group` + `Value` — sem
campo de cor. Duas rotas:

- **Entidade nova dedicada** (`EventType`: `Name`, `Color`, `Enabled`) — mais "correto" no sentido
  de não misturar responsabilidades, mas contraria o pedido explícito de ficar *"na lista de opções
  do menu de admin"* (ou seja, dentro da tela `selectable-options/` que já existe).
- **Estender `SelectableOption`** com um campo `Color` (`string?`, hex, ex. `#3788d8`, só
  relevante quando `Group == EventType`, ignorado nos outros 4 grupos) — bate literalmente com o
  pedido, é uma coluna nullable a mais numa tabela já genérica, sem side-effect nos grupos
  existentes.

**Recomendação: estender `SelectableOption` com `Color` nullable** + novo
`SelectableOptionGroup.EventType`, e adicionar um `<input type="color">` na tela admin existente,
mostrado só quando o grupo ativo é `EventType`. Seed inicial com 4-5 tipos (Reunião, Prazo,
Lembrete, Aniversário, Outro), cada um com uma cor diferente. **Confirma essa rota, ou prefere a
entidade dedicada?**

## 5. Decisão a validar #4 — Participantes

Pedido: *"lista de participantes, podendo selecionar usuários cadastrados ou inserir e-mail de
outros contatos"* + *"um evento pode ter N participantes"`. Não existe precedente exato no código
(o mais próximo, `TripDriver`, sempre liga a um `Driver` real, nunca a um contato livre).

**Proposta**: entidade nova `EventParticipant` (join table clássica):

```csharp
public class EventParticipant : BaseModel
{
    [ForeignKey("Event")]
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;

    // Preenchido quando o participante é um usuário do sistema.
    public string? UserId { get; set; }
    public User? User { get; set; }

    // Preenchidos quando o participante é um contato livre (sem UserId).
    public string? Name { get; set; }
    public string? Email { get; set; }
}
```

Regra de validação no `EventParticipantService` (nível de serviço, mesmo estilo das outras
validações do projeto — não é constraint de banco): **`UserId` preenchido OU (`Name`/`Email`
preenchido)** — nunca as duas coisas vazias. Isso é aplicação direta de padrão existente, não
precisa de confirmação separada, mas está aqui porque o shape da entidade é novo.

## 6. Backend

### 6.1 Modelo `Event`

```csharp
public class Event : BaseModel
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public DateTime StartDate { get; set; }   // data + hora de início, uma coluna só
    public DateTime EndDate { get; set; }     // data + hora de fim

    [ForeignKey("EventType")]
    public Guid EventTypeOptionId { get; set; }   // SelectableOption, Group = EventType
    public SelectableOption EventType { get; set; } = null!;

    // Quem criou o evento (preenchido automaticamente = usuário logado, não editável no form).
    public string CreatedByUserId { get; set; } = string.Empty;
    public User CreatedByUser { get; set; } = null!;

    // --- Vínculo com outras entidades: 1 FK opcional por entidade, mesmo padrão do Attachment.
    // Pelo menos uma precisa estar preenchida (validado em EventService.Add/Update).
    public Guid? BusinessPartnerId { get; set; }
    public BusinessPartner? BusinessPartner { get; set; }
    public Guid? QuoteId { get; set; }
    public Quote? Quote { get; set; }
    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }
    public Guid? PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }
    public Guid? TripId { get; set; }
    public Trip? Trip { get; set; }
    public Guid? TransactionId { get; set; }
    public Transaction? Transaction { get; set; }
    public Guid? PaymentId { get; set; }
    public Payment? Payment { get; set; }
    public Guid? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public Guid? DriverId { get; set; }
    public Driver? Driver { get; set; }
    public Guid? VehicleMaintenanceId { get; set; }
    public VehicleMaintenance? VehicleMaintenance { get; set; }
    public Guid? FuelLogId { get; set; }
    public FuelLog? FuelLog { get; set; }

    public ICollection<EventParticipant> Participants { get; set; } = [];
}
```

Campo `Color` **não existe em `Event`** — vem sempre de `Event.EventType.Color` (fonte única).

### 6.2 Regra "precisa de pelo menos um vínculo"

Em `EventService.Add`/`Update`, antes de persistir: se as 11 FKs de vínculo estiverem todas nulas,
retorna `WebApiResponse` com `Status = Error` e mensagem tipo *"Selecione ao menos um cliente,
pedido, transação, viagem ou outra entidade pra vincular o evento."* — mesmo estilo de validação
de negócio já usado em outros `*Service.cs` do projeto (não é `[Required]`/DataAnnotation, porque
a regra é "pelo menos um dos onze", não "campo X obrigatório").

### 6.3 Services/Controllers/DTOs

`IEventService`/`EventService`, `IEventParticipantService`/`EventParticipantService`,
`EventsController`, `EventParticipantsController`, `EventDto`/`EventParticipantDto` — espelhando
estrutura de `PurchaseOrderProduct`/`VehicleMaintenanceProduct` (`Add`, `Update`, `Remove`,
`FindAll`, `FindById`) mais os 11 métodos `FindByXId` (um por FK de vínculo, ver 6.4) e um
`FindByUserId(string userId)` — usado tanto pela aba de Usuário (`Participants.Any(p => p.UserId
== id)` OR `CreatedByUserId == id`) quanto pelo filtro "meus eventos"/sino de navbar.

`AutoMapper`: `Event → EventDto` traz `EventTypeName`/`EventTypeColor` (via `EventType.Value`/
`EventType.Color`) e uma lista simplificada de participantes (nome resolvido: `User.FirstName +
" " + User.LastName` quando `UserId` setado, senão `Name`/`Email` livres) — mesmo padrão de
`ProductName`/`ProductSku` computados em `PurchaseOrderProductDto`.

### 6.4 Consultas em cascata ("entidade + filhos")

A regra pedida — "Pedido de Venda mostra o pedido e seus filhos (transações, pagamentos)",
"Transação mostra a si e os pagamentos" — usa exatamente a denormalização que `Transaction`/
`Payment` já têm hoje (seção 1). Três exemplos concretos (os outros 8 seguem a mesma receita):

```csharp
// Order: eventos ligados diretamente ao pedido, à sua Transaction, ou a qualquer Payment dela.
public Task<WebApiResponse<IEnumerable<EventDto>>> FindByOrderId(Guid orderId) =>
    QueryAsync(e =>
        e.OrderId == orderId ||
        (e.Transaction != null && e.Transaction.OrderId == orderId) ||
        (e.Payment != null && e.Payment.OrderId == orderId));

// Transaction: eventos ligados diretamente a ela ou a qualquer um dos seus Payments.
public Task<WebApiResponse<IEnumerable<EventDto>>> FindByTransactionId(Guid transactionId) =>
    QueryAsync(e =>
        e.TransactionId == transactionId ||
        (e.Payment != null && e.Payment.TransactionId == transactionId));

// BusinessPartner: eventos ligados diretamente a ele, ou a qualquer Order/PurchaseOrder/Quote/
// Trip/Transaction/Payment que já carreguem o mesmo BusinessPartnerId (todos denormalizam isso
// hoje - ver seção 1).
public Task<WebApiResponse<IEnumerable<EventDto>>> FindByBusinessPartnerId(Guid businessPartnerId) =>
    QueryAsync(e =>
        e.BusinessPartnerId == businessPartnerId ||
        (e.Order != null && e.Order.BusinessPartnerId == businessPartnerId) ||
        (e.PurchaseOrder != null && e.PurchaseOrder.BusinessPartnerId == businessPartnerId) ||
        (e.Quote != null && e.Quote.BusinessPartnerId == businessPartnerId) ||
        (e.Trip != null && e.Trip.BusinessPartnerId == businessPartnerId) ||
        (e.Transaction != null && e.Transaction.BusinessPartnerId == businessPartnerId) ||
        (e.Payment != null && e.Payment.BusinessPartnerId == businessPartnerId));
```

`Vehicle`/`Driver`/`VehicleMaintenance`/`FuelLog`/`PurchaseOrder`/`Trip`/`Quote` seguem o padrão
simples (só o próprio FK, sem netos pra incluir — nenhum desses tem uma cadeia de filhos com data
própria dentro do escopo da v1).

### 6.5 Feature toggle

Novo grupo `AgendaModule`, com duas entidades por baixo dele (mesmo desenho de `AttachmentsModule`
+ `Attachment`, ou `FleetModule` + `DriverLicenseAlert`):

```csharp
/// <summary>Gates o módulo de Agenda/Calendário inteiro (tela, abas em outras entidades).</summary>
public const string AgendaModule = "AgendaModule";

// --- Entidades (Agenda group) ---
public const string Event = "Event";

/// <summary>Gates o sino de próximos eventos na navbar.</summary>
public const string UpcomingEventAlert = "UpcomingEventAlert";
```

Espelhar em `feature-toggle.model.ts` (e aproveitar pra completar o mirror TS que já estava
defasado das chaves existentes — gap pré-existente, fora do escopo mas fácil de resolver junto).

### 6.6 AlertConfig

Nova chave, mesmo desenho de `DriverLicenseExpiry` (com `ThresholdDays`):

```csharp
/// <summary>Eventos que começam dentro de ThresholdDays dias (sino da navbar + "meus eventos").</summary>
public const string UpcomingEventReminder = "UpcomingEventReminder";
```

Editável na tela "Configuração → Alertas" (`alert-configs/`) já existente, sem UI nova — é exatamente
o *"opção pra ligar/desligar esse alerta dentro da área de configuração/alertas"* do pedido.

### 6.7 Seed

`DatabaseSeeder.cs`: `FeatureToggle` (`AgendaModule` group + `Event` + `UpcomingEventAlert`
entities, todos `Enabled = true` por padrão), `AlertConfig` (`UpcomingEventReminder`, `Enabled =
true`, `ThresholdDays = 1`), `SelectableOption` (4-5 valores do grupo `EventType`, cada um com
`Color`).

## 7. Frontend

### 7.1 Novo módulo `agenda/`

Mesma estrutura de `purchase-orders/`: `agenda.routes.ts` exportando `AGENDA_ROUTES`
(`'' → AgendaComponent`, sem rota `:id` — evento sempre abre em modal, nunca em página própria,
já que não tem sub-abas de detalhe), registrado em `app.routes.ts` com
`data: { featureFlag: 'AgendaModule' }` + `canActivateChild: [AuthorizationGuard]`. Sidebar: item
novo `Agenda`/`Calendário`, **proposto no grupo de topo** (junto de Home/Clientes/Fornecedores/
Produtos/Orçamentos/Pedidos — não dentro de "Fretamento" nem "Financeiro", já que é transversal a
ambos). Confirma esse lugar ou prefere outro?

### 7.2 Tela principal (`AgendaComponent`)

- Área de filtros (escondida por padrão, mesmo padrão de `cardCollapseAnimation` usado no
  Relatório de Frota/Locações) + botão "Adicionar" (abre `EventDetailsModalComponent` em modo
  criação).
  - Um filtro pré-definido "Meus eventos" (checkbox/toggle) — aplica `FindByUserId(currentUserId)`
    em vez de `FindAll()`.
- Toggle de visualização Grid/Calendário — em vez de inventar um controle novo, reaproveita o
  **mesmo padrão de abas do painel de Feature Toggles** (`BY_GROUP`/`DETAILED`, dois botões tipo
  segmented-control) — o pedido citou "como temos hoje na área de anexos", mas Anexos hoje não tem
  esse alternador (é só uma árvore); o equivalente real mais próximo no código é esse.
  - **Grid**: `app-grid` padrão (mesmas colunas/ações de sempre: Título, Tipo, Início, Fim,
    Vínculo, ações editar/excluir).
  - **Calendário**: `<full-calendar>` (`@fullcalendar/angular`) com plugins `dayGrid`+`timeGrid`+
    `interaction`, `eventClick` abre o modal em edição, `select` (arrastar um intervalo) abre o
    modal em criação com `StartDate`/`EndDate` pré-preenchidos, `backgroundColor` de cada evento =
    `EventType.Color`.

### 7.3 `EventDetailsModalComponent` + `EventFormComponent`

Form com: Título, Descrição, Data/Hora início, Data/Hora fim (dois `app-date-field` + dois campos
de hora), Tipo de evento (select, popula from `SelectableOptionService.getByGroup(EventType)`),
bloco de vínculo (N campos autocomplete — Cliente/Fornecedor, Pedido de Venda, Pedido de Compra,
Orçamento, Viagem, Transação, Pagamento, Veículo, Motorista, Manutenção, Abastecimento — todos
opcionais individualmente, mas **submit bloqueado se todos vazios**, mesma mensagem de erro do
backend replicada no client antes do POST pra feedback imediato), bloco de participantes (grid
inline: autocomplete de `User` já cadastrado OU inputs livres de nome/e-mail, com botão adicionar/
remover linha — mesmo shape do `app-product-picker-grid`, adaptado pra pessoas em vez de produtos).

Quando aberto a partir da **aba de uma entidade** (ex. Cliente), o campo de vínculo correspondente
já vem preenchido e desabilitado (mesmo comportamento do `vehicleId` pré-setado no form de
Manutenção quando embutido dentro da tela de Veículo).

### 7.4 Aba "Agenda" reaproveitável (todas as entidades da seção 3)

Componente `app-event-list` (nome análogo a `app-attachments`), com `@Input() entity` +
`@Input() entityId`, replicando o trio de mapas (`entityIdField`, `entityMap` com os `FindByXId`
em cascata da seção 6.4, sem precisar do `entityFolderKey`/`detect_pathPrefix` — esses só existem
em Anexos por causa da árvore de pastas em disco, que Agenda não tem). Mesma visão dupla
Grid/Calendário da tela principal, mas usando o dado já filtrado. Embutido do mesmo jeito que
Anexos:

```html
@if (activeTab === 'agenda') {
  <app-event-list [entity]="'order'" [entityId]="data.id"></app-event-list>
}
```

Cada entidade da seção 3 ganha essa aba nova (Cliente/Fornecedor, Orçamento, Pedido de Venda,
Pedido de Compra, Viagem, Transação, Pagamento, Veículo, Motorista, Manutenção, Abastecimento).

### 7.5 Aba "Agenda" em Usuário

Mesmo componente `app-event-list`, `[entity]="'user'"` — mas usando `FindByUserId` (participante
OU criador) em vez de um dos `FindByXId` de vínculo, já que Usuário não é uma das 11 entidades
vinculáveis, é quem participa.

### 7.6 Navbar: sino + atalho no menu do usuário

- `app-upcoming-event-notification` novo em `navbar/components/`, mesmo shape de
  `stock-alert-notification` (busca via `EventService.findByUserId` + filtro client-side por
  `StartDate` dentro do `ThresholdDays` do `AlertConfig`, badge de contagem, "Ver todos" →
  `/agenda?onlyMine=true`). Visibilidade decidida em `NavbarComponent.ts` via
  `combineLatest([AgendaModule, UpcomingEventAlert])`, nunca dentro do próprio componente — mesma
  regra documentada no `CLAUDE.md`.
- Novo item no menu suspenso do usuário (avatar "Admin" no canto superior direito) — "Meus
  Eventos", navega pra `/agenda?onlyMine=true` (mesma query string que o "Ver todos" do sino usa,
  a tela principal lê e pré-marca o filtro "Meus eventos" da seção 7.2).

### 7.7 Configuração → Alertas

Nenhuma tela nova — `AlertConfigKeys.UpcomingEventReminder` (seção 6.6) já aparece automaticamente
no painel existente (`alert-configs.component.ts` itera todas as `AlertConfig` do banco).

## 8. Arquivos a criar/alterar

**Backend:**
- `TSI.Nexus.Contracts/Models/Event.cs` (novo)
- `TSI.Nexus.Contracts/Models/EventParticipant.cs` (novo)
- `TSI.Nexus.Contracts/Models/SelectableOption.cs` (+ `Color`)
- `TSI.Nexus.Contracts/Enums/SelectableOptionGroup.cs` (+ `EventType`)
- `TSI.Nexus.Contracts/Models/FeatureToggleKeys.cs` (+ `AgendaModule`, `Event`, `UpcomingEventAlert`)
- `TSI.Nexus.Contracts/Models/AlertConfigKeys.cs` (+ `UpcomingEventReminder`)
- `TSI.Nexus.Contracts/Models/DTOs/EventDto.cs`, `EventParticipantDto.cs` (novos)
- `TSI.Nexus.Contracts/Interfaces/IEventService.cs`, `IEventParticipantService.cs` (novos)
- `TSI.Nexus.Services/Services/EventService.cs`, `EventParticipantService.cs` (novos)
- `TSI.Nexus.Services/tests/.../EventServiceTests.cs`, `EventParticipantServiceTests.cs` (novos)
- `TSI.Nexus.WebAPI/Controllers/EventsController.cs`, `EventParticipantsController.cs` (novos)
- `TSI.Nexus.IoC/MappingProfile.cs` (+ mapeamentos `Event`/`EventParticipant`)
- `TSI.Nexus.IoC/NativeInjector.cs` (+ registros de serviço/repositório)
- `TSI.Nexus.Data/MyDBContextEF.cs` (+ `DbSet<Event>`, `DbSet<EventParticipant>`)
- Migration nova (tabelas `Event`, `EventParticipant`, coluna `SelectableOption.Color`)
- `TSI.Nexus.Data/Seed/DatabaseSeeder.cs` (feature toggles + alert config + tipos de evento)

**Frontend:**
- `package.json` (+ `@fullcalendar/angular`, `@fullcalendar/core`, `@fullcalendar/daygrid`,
  `@fullcalendar/timegrid`, `@fullcalendar/interaction`) — só após confirmação da Decisão 1
- `core/models/event.model.ts`, `event-participant.model.ts` (novos)
- `core/services/event/event.service.ts` (novo)
- `core/enums/api-type.enum.ts` (+ `Events`, `EventParticipants`)
- `core/models/feature-toggle.model.ts` (+ novas chaves, e completar o mirror que já estava defasado)
- `agenda/agenda.routes.ts`, `agenda/agenda.component.ts/.html/.scss` (novos)
- `agenda/components/event-details-modal/`, `event-form/` (novos)
- `shared/event-list/event-list.component.ts/.html/.scss` (novo, análogo a `shared/attachments`)
- `shared/components/event-calendar-view/` (novo — o wrapper do FullCalendar, reaproveitado pela
  tela principal e por `event-list`)
- `navbar/components/upcoming-event-notification/` (novo)
- `navbar/navbar.component.ts/.html` (+ toggle de visibilidade do sino novo, + item no menu do usuário)
- `shared/sidebar/sidebar.component.html` (+ item Agenda)
- `app.routes.ts` (+ rota `agenda`)
- `selectable-options/selectable-options.component.ts/.html` (+ grupo `EventType` com campo de cor)
- Uma edição por entidade da seção 3 (`*-details-page.component.html/.ts`) pra adicionar a aba
  Agenda — 11 arquivos de página + 11 de import de componente
- `users/components/user-details-page/user-details-page.component.html/.ts` (+ aba Agenda)
- `core/i18n/pt-br.ts`, `en.ts`, `es.ts` (+ chaves novas)

## 9. Verificação

1. `dotnet build`/`dotnet test` limpos com a migration aplicada.
2. Criar evento sem nenhum vínculo selecionado → bloqueado (mensagem de erro, front e back).
3. Criar evento vinculado só a um Pedido de Venda → aparece na aba Agenda do Pedido, da Transação
   dele, de cada Pagamento dela, e do Cliente do pedido — não aparece em outro Pedido qualquer.
4. Duplo-clique num evento no calendário → abre modal de edição com os dados certos.
5. Arrastar/selecionar um intervalo vazio no calendário → abre modal de criação com
   início/fim pré-preenchidos pelo intervalo selecionado.
6. Alternar Grid ↔ Calendário na tela principal e dentro de uma aba Agenda de entidade — mesmos
   dados, duas visualizações.
7. Adicionar um participante existente (usuário do sistema) e um participante livre (nome + e-mail)
   no mesmo evento → os dois aparecem na lista, e o evento aparece na aba Agenda do usuário
   participante.
8. Desligar `AgendaModule` no painel de Módulos → item do sidebar, abas em todas as entidades e
   sino da navbar somem juntos; religar traz tudo de volta sem perda de dados.
9. Desligar só `UpcomingEventAlert` (com `AgendaModule` ligado) → sino some, mas o módulo/abas
   continuam funcionando normalmente.
10. Desligar `UpcomingEventReminder` em Configuração → Alertas → sino para de listar eventos
    mesmo com os dois FeatureToggles ligados; mudar `ThresholdDays` muda a janela de eventos que
    aparecem.
11. Botão "Meus Eventos" no menu do usuário e o "Ver todos" do sino levam pra `/agenda` com o
    filtro "Meus eventos" já marcado.
12. Cadastrar um novo tipo de evento com cor na tela de Lista de Opções → aparece no select do
    form de evento e a cor certa aparece no calendário.
