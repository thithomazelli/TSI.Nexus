# Spec 3 — Ajustes de padrão, transação de Pedido de Compra, Manutenção/Abastecimento e reorganização do sidebar

> Escrito antes de qualquer código ser tocado. Levantamento feito via 6 pesquisas paralelas no
> código (não redesenho, é o que já existe) + 2 perguntas de esclarecimento já respondidas nesta
> sessão (seção 0). Aguardando seu "ok" no desenho antes de codar, como de praxe no fluxo de specs
> deste projeto.

## 0. Decisões já validadas com você

1. **Status de Manutenção**: mantém o enum C# de 5 valores como está hoje (`Scheduled` / `InProgress`
   / `Completed` / `Overdue` / `Cancelled`) e a lógica de bloqueio automático de veículo
   (`SyncVehicleStatusAsync`) **sem nenhuma mudança**. O único gap real era o campo não aparecer no
   modal de edição — só isso será adicionado.
2. **Status de Abastecimento**: campo novo (hoje não existe), via Lista de Opções
   (`SelectableOption`), com os 3 valores padrão pedidos (Agendado / Cancelado / Concluído).
3. **Produto em Abastecimento**: campo único de autocomplete SKU/Nome, sem grid de staging — só
   Manutenção usa o grid completo (`ProductPickerGrid`, N produtos).

## 1. Problema 1 — Transação de Pedido de Compra deve falar de "Despesa", não "Pagamento" + seed

### 1.1 O que existe hoje

`TransactionFormComponent` (`transactions/components/transactions-form/transaction-form.component.ts`)
é compartilhado por Pedido de Venda e Pedido de Compra (embutido via `<app-transaction-form>`). O
form group monta **os dois pares de campos ao mesmo tempo**, sem nenhum `*ngIf` condicionando por
`type` (`PaymentType.Incoming`/`Outgoing`): `totalOfPayments`/`paymentTotalPrice` E
`totalOfExpenses`/`expenseTotalPrice` sempre aparecem juntos no template
(`transaction-form.component.html:253-310`). `onTypeChanges()` (`.ts:198-234`) já existe como
ponto de reação a troca de tipo, mas hoje só mexe em validators de cliente/fornecedor, nunca nos
campos de total.

Achado importante: **o backend já sabe processar despesa** —
`TransactionService.CreatePayments` (`.cs:517-590`) gera N `Payment` do tipo `Outgoing` a partir
de `TotalOfExpenses`/`ExpenseTotalPrice` exatamente como gera N `Payment` `Incoming` a partir de
`TotalOfPayments`/`PaymentTotalPrice` — só que **nenhum formulário do frontend jamais escreveu
nesses campos**, então esse caminho está morto por falta de UI, não por falta de backend.

`order-form.component.ts`/`purchase-order-form.component.ts` têm cada um seu
`updateTotalPriceFields()`, que hoje só escreve em `paymentTotalPrice` (nenhum dos dois toca
`expenseTotalPrice`).

Seed: `DemoDataSeeder.cs` não tem nenhuma referência a `PurchaseOrder`/`PurchaseOrderProduct` — a
seção inteira está ausente. `BuildOrders`/`BuildOrderProducts`/`BuildPayments`
(`.cs:672-950+`) são os métodos-espelho a seguir; `BuildExpenses` já existe e já usa
`suppliers` para transações `Outgoing`, o que confirma que fornecedores já são seedados.

### 1.2 Design

- **`TransactionFormComponent`**: em `onTypeChanges()`, alternar qual par de campos fica visível —
  `type === Incoming` mostra Total de Pagamentos/Preço Total do Pagamento, `type === Outgoing`
  mostra Total de Despesas/Preço Total da Despesa. Isso conserta de graça qualquer outro uso futuro
  do componente com `type=Outgoing`, não só Pedido de Compra.
- **`purchase-order-form.component.ts`**: como o `type` da transação já vem fixo em `Outgoing`
  nesse contexto, `updateTotalPriceFields()`/`setupTotalOfPaymentsWatcher()` passam a escrever em
  `expenseTotalPrice`/`totalOfExpenses` em vez de `paymentTotalPrice`/`totalOfPayments`.
  `order-form.component.ts` (Pedido de Venda) fica **inalterado**.
- i18n: reaproveito as chaves de rótulo se já existirem (`TRANSACTIONS.*`); senão crio as novas nas
  3 línguas.

### 1.3 Seed

- Nova `BuildPurchaseOrders` (espelha `BuildOrders`, usando `suppliers` em vez de `clients`,
  `Transaction` `Outgoing` com `totalOfExpenses`/`expenseTotalPrice`) + `BuildPurchaseOrderProducts`
  (espelha `BuildOrderProducts`, ajustando estoque) + geração de `Payment` `Outgoing` equivalente a
  `BuildPayments`. Mesma ordem de grandeza do seed de `Order` (o suficiente pra popular telas e
  relatórios de teste).

## 2. Problema 2 — Padrão visual das telas de detalhes (cartão lateral + tamanho de botão)

### 2.1 O que existe hoje

- **Cartão lateral com ícone + resumo**: existe em Pedido/Cliente/etc.
  (`order-details-page.component.html:11-53`: `.row` → `.col-md-3` com ícone `bi-receipt` + `<ul
  class="list-group list-group-unbordered">` resumindo número/parceiro/status). **Veículo e
  Motorista não têm isso** — os dois usam um único card full-width contendo direto as abas
  (`vehicle-details-page.component.html:9-11`, `driver-details-page.component.html:17-19`).
- **Tamanho de botão**: Veículo e Motorista são os **únicos** dois formulários do sistema que usam
  `btn-sm` nos botões Cancelar/Remover/Salvar (`vehicle-form.component.html:200-212`,
  `driver-form.component.html`). Todos os outros checados (Pedido de Venda, Pedido de Compra,
  Cliente/Fornecedor, Orçamento, Produto) usam o botão padrão do Bootstrap sem `btn-sm`. Não é CSS
  escondido — os `.scss` desses componentes estão vazios; é só a classe `btn-sm` mesmo.

### 2.2 Design

- **`btn-sm` vira o tamanho oficial** dos 3 botões de ação (Cancelar/Remover/Salvar-Adicionar) em
  **todo formulário do sistema**. Levantamento completo por grep na hora de implementar (padrão
  `btn btn-(secondary|danger|success)` sem `btn-sm` em `.html` de formulários) — já sei que pelo
  menos estes precisam do ajuste: `order-form`, `purchase-order-form`, `order-products-form`,
  `purchase-order-products-form`, `business-partner-form`, `quote-form`, `product-form`, além de
  qualquer outro form/modal que eu encontrar com o mesmo padrão de 3 botões.
- **Cartão lateral**: Veículo e Motorista ganham a mesma estrutura de `order-details-page` (`.row`
  → `.col-md-3` com ícone + resumo, `.col-md-9` com as abas). Ícones: `bi-bus-front` (Veículo) e
  `bi-person-vcard` (Motorista) — os mesmos já usados no sidebar, pra manter consistência. Resumo do
  Veículo: Placa / Modelo / Status. Resumo do Motorista: Nome / CNH / Status. Nenhum botão extra no
  cartão lateral desses dois (diferente de Pedido, que tem "Emitir Contrato/OS" — Veículo/Motorista
  não têm um análogo).

## 3. Problema 3 — Abas de Veículo/Motorista fora do padrão

Achado: a única diferença estrutural real encontrada entre as abas de Veículo/Motorista e as de
Pedido é o atributo `data-toggle="tab"` presente nas primeiras e ausente na segunda — Angular já
controla a troca via `[class.active]`/`(click)="activeTab = 'x'"` nos três casos, então esse
atributo é resquício do JS nativo de tabs do Bootstrap 4 e não tem função alguma aqui (na melhor
das hipóteses redundante, na pior conflita com o binding do Angular). Vou remover esse atributo de
Veículo/Motorista pra ficar idêntico ao markup de Pedido. **Se o problema visual que você via era
outro** (cor, espaçamento, algo que a pesquisa não capturou comparando os arquivos lado a lado), me
avisa com mais detalhe/print que eu ajusto o item certo.

## 4. Problema 4 — Manutenção e Abastecimento ligados a produtos, com débito de estoque

### 4.1 Manutenção (VehicleMaintenance)

**Hoje**: `VehicleMaintenance` já tem `ProductId?`/`Product?` + `PartQuantity` (1 produto só,
direto no registro). Existe um interceptor dedicado,
`MaintenancePartsStockAdjustingSaveChangesInterceptor.cs`, que **já debita estoque** — mas debita
assim que a linha é criada (`Added`), não quando o status vira "Concluída". O modal
(`vehicle-maintenance-details-modal.component.html`) tem `type`/`scheduledDate`/`description`/
`cost`/`partQuantity`/`productId` (um `<select>` simples, não autocomplete) — **sem campo de
Status** (o status só é alterado pelos botões de ação da lista, "concluir"/"cancelar").

**Design**:
- Modal ganha um `<select>` de Status usando o enum `MaintenanceStatus` existente (mesmas
  labels/cores já usadas em `vehicle-maintenance-list.component.ts`'s `statusMap`) — sem mudar o
  enum nem a lógica de bloqueio de veículo.
- Produto passa de "1 direto no registro" para **N produtos via tabela nova**
  `VehicleMaintenanceProduct` (`Id`, `VehicleMaintenanceId`, `ProductId`, `ProductSku`,
  `ProductName`, `ProductType`, `Quantity`, `Price`, `Discount`, `TotalPrice`) — espelha
  `OrderProduct`/`PurchaseOrderProduct`. Remove `ProductId`/`PartQuantity` de `VehicleMaintenance`
  (migração preserva os poucos registros existentes convertendo pra 1 linha na tabela nova quando
  havia produto setado).
- Modal ganha `<app-product-picker-grid [filterOutOfStock]="true">` (o mesmo componente reusado em
  Pedido de Venda/Compra) no lugar do `<select>` simples — autocomplete SKU/Nome, staging em grid,
  fluxo "produto não encontrado, deseja cadastrar?" idêntico.
- `MaintenancePartsStockAdjustingSaveChangesInterceptor.cs` é reescrito no mesmo padrão de
  `PurchaseOrderStockIncrementingSaveChangesInterceptor.cs`: só debita quando
  `VehicleMaintenance.Status` transiciona **para** `Completed` (compara `OriginalValues["Status"]`
  vs valor atual em `Modified`), somando as quantidades de todas as `VehicleMaintenanceProduct`
  daquela manutenção — não mais no momento em que a linha nasce.

### 4.2 Abastecimento (FuelLog)

**Hoje**: `FuelLog` não tem Status nem nenhum vínculo com Product — campos são
`date`/`odometer`/`liters`/`pricePerLiter`/`gasStation` (texto livre). Modal
(`fuel-log-details-modal.component.html`) reflete isso, sem nenhum dos dois.

**Design**:
- Status novo: `SelectableOptionGroup.FuelLogStatus` (nome exato a definir na implementação), 3
  valores seed (Agendado/Cancelado/Concluído) — mesmo mecanismo de Tipo de Endereço/Categoria de
  Produto/Categoria de Transação (`SelectableOptionService.getByGroup` + `<select
  [ngValue]="option.value">`). Aparece também no admin "Listas de Opções".
- Produto novo: `ProductId` (+ `ProductSku`/`ProductName` denormalizados) direto em `FuelLog` — só
  1 produto, **sem grid**. Autocomplete SKU/Nome dedicado implementado direto no modal do
  Abastecimento, copiando a lógica de `OrderProductsFormComponent`
  (`onProductSkuBlur`/`onProductNameBlur`/`selectProduct`, incluindo "produto não encontrado,
  deseja cadastrar?") — sem extrair um componente novo, já que só há esse 1 uso hoje.
- Novo interceptor `FuelLogStockAdjustingSaveChangesInterceptor.cs`, mesmo padrão de
  transição-de-status do `PurchaseOrderStockIncrementingSaveChangesInterceptor.cs`: debita
  `Liters` do produto vinculado quando `Status` transiciona pro valor "Concluído".

### 4.3 Padronização dos 2 modais

Botões Cancelar/Salvar dos dois já usam `btn-sm` — compatível com a decisão do Problema 2, sem
mudança aí. Reviso layout/padding do footer pra bater com os outros modais durante a implementação.

## 5. Problema 5 — Anexos em Veículo e Motorista

`Attachment.cs` não tem `VehicleId`/`DriverId` hoje — mas `Vehicle.Attachments`/`Driver.Attachments`
**já existem como navegação órfã** (sem FK correspondente do lado de `Attachment`), então esse
trabalho completa uma relação já anunciada no modelo, não cria algo do zero.

**Design** (mesma extensão feita pra Pedido de Compra nesta sessão, agora pra Veículo/Motorista):
- `Attachment.cs` ganha `VehicleId?`/`Vehicle?` e `DriverId?`/`Driver?`.
- `AttachmentService`: `GetByVehicleId`/`GetByDriverId` + branches em
  `ResolveParentIdsAsync`/`BuildEntityPathAsync`/`ParseOverridePathAsync`. Como Veículo/Motorista
  não são escopados por `BusinessPartner`, o path fica na raiz — `Vehicles/{Placa}` e
  `Drivers/{Nome-sanitizado}` — paralelo a `Products/{Nome}`/`Users/{UserId}` já existentes, e não
  ao padrão `BusinessPartners/{Nome}/Orders/{Número}` usado por Pedido/Viagem.
- `AttachmentsController`: `GetByVehicleId`/`GetByDriverId`.
- `AttachmentsComponent` (frontend): casos `'vehicle'`/`'driver'` em
  `entityIdField`/`loadAttachments`/`entityFolderKey`/`detect_pathPrefix`/`buildTree` — mesmo
  padrão já aplicado pra `'purchaseOrder'`.
- Abas "Anexos" novas em `vehicle-details-page`/`driver-details-page`.

## 6. Problema 6 — Sidebar: Manutenção/Abastecimento + subcategoria "Fretamento"

Achados: `VehicleMaintenance`/`FuelLog` **já existem** como chaves de toggle
(`FeatureToggleKeys.cs:41-42`), **já são seedados** (`DatabaseSeeder.cs:261-271`, "Manutenções"/
"Abastecimentos") e **já são aplicados** nos respectivos services
(`VehicleMaintenanceService.cs:135,166,202`, `FuelLogService.cs:122,156`) — isso é o "essa opção
que não sei o que esconde" que você mencionou: ela já funciona no backend e já aparece no admin de
módulos, só nunca ganhou item no sidebar nem tela própria. `Sidebar.component.html` hoje é uma
`<ul>` única (não `<ul>`s separadas por seção) — "Financeiro"/"Admin"/"Config" são só `<li
class="nav-header">` inline; "Fretamento" segue o mesmo mecanismo.

**Design**:
- Novos componentes de lista + rotas standalone cross-veículo: `/vehicle-maintenances` e
  `/fuel-logs`, espelhando como `PaymentsComponent` já funciona nos dois contextos (embutido no
  Veículo via `[parentData]`/`[entity]`, e como tela cheia própria).
- Sidebar: novo `<li class="nav-header">{{ 'SIDEBAR.CHARTERING' | translate }}</li>` (rótulo
  "Fretamento"), reagrupando visualmente: Frota, Motoristas, Viagens, Relatório de Frota (mantém o
  gate atual `isAdmin||isMaster` deste último — só muda de lugar, não de visibilidade) + as 2
  entradas novas Manutenção/Combustível.
- As 2 entradas novas seguem a regra "grupo E entidade" já documentada em `FeatureToggleKeys.cs`
  (`FleetModule` + `VehicleMaintenance` / `FleetModule` + `FuelLog`) — hoje o sidebar só olha
  toggle de grupo, nunca de entidade; esse será o primeiro lugar a aplicar a regra completa no
  sidebar, seguindo o padrão que já é seguido em outras telas.
- Nada muda no backend de toggles — só a ligação com sidebar + rotas que faltava.

## 7. Arquivos a criar/alterar (visão geral)

**Backend:**
- `TSI.Friday.Contracts/.../Models/VehicleMaintenanceProduct.cs` (novo), `FuelLog.cs` (+`ProductId`,
  `ProductSku`, `ProductName`, `Status`), `VehicleMaintenance.cs` (-`ProductId`/`PartQuantity`),
  `Attachment.cs` (+`VehicleId`, `DriverId`), `SelectableOptionGroup.cs` (+`FuelLogStatus`)
- `TSI.Friday.Data/.../Interceptors/MaintenancePartsStockAdjustingSaveChangesInterceptor.cs`
  (reescrito), `FuelLogStockAdjustingSaveChangesInterceptor.cs` (novo)
- `TSI.Friday.Data/.../Seed/SelectableOptionSeeder.cs` (+3 valores), `DemoDataSeeder.cs`
  (+BuildPurchaseOrders/BuildPurchaseOrderProducts/pagamentos), migrations novas
- `TSI.Friday.Services/.../VehicleMaintenanceService.cs`, `FuelLogService.cs`,
  `TransactionService.cs` (sem mudança de lógica, só o que já existe passa a ser exercitado),
  `AttachmentService.cs` (+GetByVehicleId/GetByDriverId + path resolution)
- Controllers: `VehicleMaintenanceProductsController.cs` (novo), `FuelLogsController.cs` (+campos),
  `AttachmentsController.cs` (+2 endpoints)
- Testes unitários correspondentes em cada projeto `.Tests`

**Frontend:**
- `transactions/components/transactions-form/` (+lógica de troca de campos por type)
- `purchase-orders/components/purchase-order-form/` (totais → despesa)
- Todos os forms com botões Cancelar/Remover/Salvar (+`btn-sm`, levantamento completo na
  implementação)
- `vehicles/components/vehicle-details-page/`, `drivers/components/driver-details-page/` (+cartão
  lateral, +aba Anexos, tabs sem `data-toggle`)
- `vehicles/components/vehicle-maintenance-details-modal/` (+Status, +ProductPickerGrid)
- `fuel-log/components/fuel-log-details-modal/` (+Status via SelectableOption, +autocomplete
  produto dedicado)
- Novo `vehicle-maintenances/` e `fuel-logs/` (telas standalone)
- `shared/attachments/attachments.component.ts` (+casos vehicle/driver)
- `shared/sidebar/` (+header Fretamento, +2 itens novos)
- `core/models/`, `core/services/`, i18n (pt-BR/en/es) para tudo acima

## 8. Verificação

1. `dotnet build`/`dotnet test` limpos.
2. `ng build` (dev + prod) limpo.
3. Fluxo manual: criar Pedido de Compra → conferir que o total vira "Despesa" e gera Payment
   Outgoing; abrir Veículo/Motorista → conferir cartão lateral, abas, botões, aba Anexos; criar
   Manutenção com 2 produtos → marcar Concluída → conferir debito de estoque; criar Abastecimento
   com produto + Status → marcar Concluído → conferir débito; conferir sidebar com "Fretamento" e
   os 2 itens novos, gate de módulo funcionando.
