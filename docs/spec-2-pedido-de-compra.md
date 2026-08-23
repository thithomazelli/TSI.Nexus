# Spec 2 — Pedido de Compra

> Escrito antes de qualquer código ser tocado. Segunda de um lote de 4 specs isoladas (3 features +
> 1 ajuste); esta é a primeira feature. Traz uma decisão de modelagem (entidade nova vs. reaproveitar
> `Order`/`OrderProduct`) e agora também a remoção do modelo de locação em Pedido de Venda — ambas
> precisam de validação explícita antes de codar (seções 2 e 3 já validadas por você, ver notas).

## 1. Contexto: como Pedido de Venda funciona hoje

Levantamento feito no código (não redesenho, é o que já existe):

- **`Order`** (`BusinessPartnerId`, `TransactionId`, `Payments`, `OrderProducts`, `Attachments`) —
  liga a um `BusinessPartner` (hoje sempre tipo `Client` na tela de Pedido de Venda), uma
  `Transaction`, N `Payments`, N `Attachments`, N `OrderProduct`. `OrderStatus` = `Open` / `Closed`
  / `WaitingPayment`. Nenhum efeito colateral especial acontece hoje quando o status vira `Closed`
  — é só um valor de enum.
- **`OrderProduct`** (`ProductId`, `Quantity`, `Price`, `Discount`, **`StartDate`/`EndDate`**,
  `OrderProductStatus` = `InProgress` / `Delayed` / `Returned`) — o shape é de **locação**
  (caçamba alugada por um período), não de "linha de pedido" genérica. `Returned` é o estado que
  devolve o produto pro estoque.
- **Reserva de estoque hoje** (`StockAdjustingSaveChangesInterceptor.cs`): interceptor genérico do
  `SaveChanges`, dispara em cima de mudanças em `OrderProduct` especificamente — ao **adicionar**
  um item reserva estoque (`QuantityInStock -= quantity`), ao **remover/mudar pra `Returned`**
  devolve. Só aplica em `Product.Type` `Sale`/`Rental`. Não olha o `Order.Status` — a reserva é por
  item, não por "pedido fechado".
- **Picker de produto (a peça que você quer reaproveitar)**: já existe, pronto, dentro de
  `orders/components/order-form/order-form.component.ts` (851 linhas) — autocomplete Angular
  Material por SKU/nome (`setupInlineProductAutoComplete`), adição direto na grid staging
  (`inlineProductForm` + tabela), bloqueio de produto sem estoque na lista do autocomplete
  (`product.quantityInStock <= 0`), validação de quantidade acima do estoque
  (`onInlineProductSkuBlur`/`STOCK_EXCEEDED_MESSAGE`), e o fluxo "produto não encontrado, deseja
  cadastrar?" (`COMMON.CONFIRM_ADD_ENTITY` → abre `ProductDetailsModalComponent` com o SKU
  pré-preenchido). Também existe o caminho por modal (botão que abre `OrderProductFormComponent`
  em vez de usar a linha inline) — as duas formas convivem hoje no mesmo form.
- **`Attachment`**: uma coluna FK opcional **por entidade** (`OrderId`, `QuoteId`, `TripId`,
  `TransactionId`, `PaymentId`, `ProductId`, `BusinessPartnerId`) — não é polimórfico. Uma
  entidade nova que precise anexos ganha sua própria coluna + método `GetBy<Entidade>Id` em
  `AttachmentService.cs`.
- **Auditoria** (`AuditingSaveChangesInterceptor.cs`): genérico de fato, funciona em cima de
  qualquer entidade rastreada — nenhuma mudança necessária pra uma entidade nova.
- **`BusinessPartner`** já distingue `Client`/`Supplier` (`BusinessPartnerType`) — a tela de
  Fornecedores já existe e já usa esse filtro.

## 2. Remoção do modelo de locação em Pedido de Venda

**Validado com você nesta sessão** (perguntei em 3 pontos, respondidos): sim, remover locação por
completo; sim, remover junto tudo que depende dela; não, não existe dado real em produção pra
preservar — pode simplesmente apagar colunas/migration sem plano de migração de dados.

Pedido de Venda deixa de ser "locação por período" e vira venda simples: produto + quantidade +
preço, estoque desconta na hora, sem ciclo de devolução.

### 2.1 O que muda

- **`OrderProduct`**: remove `StartDate`, `EndDate`, `OrderProductStatus` (campo e enum inteiro).
  Fica só `ProductId`, `Quantity`, `Price`, `Discount`, `TotalPrice`, `OrderId`.
- **`StockAdjustingSaveChangesInterceptor.cs`**: simplifica — hoje ~40% da lógica existe só pra
  tratar transições de/para `Returned` (linhas 150-277). Sem esse status, fica: `Added` desconta
  estoque, `Deleted` devolve, `Modified` (mudança de quantidade ou de produto) ajusta o delta. Sem
  branch de status nenhuma.
- **`OrderProductService.cs`/`OrderService.cs`/`QuoteProductService.cs`**: remover qualquer
  filtro/cálculo que dependa de `OrderProductStatus` (ex.: contagem de atrasados).
- **`DashboardService.cs`**: o card 4 (`GetInfoCardsAsync`, hoje `"Devoluções em Atraso"` contando
  `OrderProductStatus.Delayed`) perde a base de dados. **Você pediu pra não deixar só 3 cards na
  tela** — troco esse card por um 4º card com **valor fixo/fictício** (placeholder claramente
  marcado no código como temporário), mesma posição, até vocês decidirem o que mostrar ali.
- **`FeatureToggleKeys.cs` + seed**: remove `RentalReport` (o toggle que acabamos de criar pro
  "Relatório de Locações") e `OrderProductAlert` (o toggle do alerta "itens de pedido em atraso"
  que acabamos de criar no Spec 1) — os dois só existiam por causa da locação.
- **Migration**: dropa as colunas/coluna de status de `OrderProduct`, sem step de preservação de
  dado (confirmado que não há dado real a proteger ainda).

### 2.2 O que some do frontend

- **`order-products` (tela "Relatório de Locações")**: a lista (`order-products.component.ts`) tem
  hoje abas/filtro por `InProgress`/`Delayed`/`Returned` — essa tela inteira deixa de fazer
  sentido e sai (menu, rota, componente). **Fica**: `OrderProductFormComponent` e
  `OrderProductsDetailsModalComponent` (o modal de adicionar/ver um item de pedido), porque são
  usados de dentro do `order-form.component.ts` (Pedido de Venda) e do alerta de navbar de
  pagamento/produto — só perdem os campos de data/status.
- **Sidebar**: remove o item "Relatório de Locações" e o código de gating (`isRentalReportEnabled`,
  `rentalReportSub`) recém-adicionado em `sidebar.component.ts`/`.html`.
- **Navbar**: remove `order-product-notification` (alerta "itens de pedido em atraso") e o gating
  que acabamos de ligar em `navbar.component.ts`/`.html` (Spec 1, `isOrderProductAlertEnabled`).
- **`core/enums/order-product-status.enum.ts`**: removido. `core/models/order-product.model.ts`:
  perde `startDate`/`endDate`/`status`.
- **i18n**: strings de `Delayed`/`InProgress`/`Returned`/"Relatório de Locações"/"Devoluções em
  Atraso" ficam órfãs — limpeza de baixa prioridade, não bloqueia o resto.

### 2.3 Efeito na Spec 1

A Spec 1 (`docs/spec-1-alertas-por-modulo.md`) fica com 3 dos 4 alertas originais (CNH, veículo
bloqueado, pagamento) — o de itens de pedido em atraso é removido por não fazer mais sentido, não
substituído. Vou marcar isso na própria Spec 1 quando implementar, em vez de reescrevê-la.

## 3. Decisão de modelagem do Pedido de Compra

**Pedido de Compra ganha entidades próprias (`PurchaseOrder`/`PurchaseOrderProduct`), não
reaproveita `Order`/`OrderProduct`.** Com a remoção da locação (seção 2), o shape de `OrderProduct`
passa a ser quase idêntico ao `PurchaseOrderProduct` proposto abaixo — mas a recomendação continua
sendo entidades separadas, porque o motivo real nunca foi o formato dos campos, foi o **gatilho de
estoque**: venda desconta por **item adicionado** (interceptor em `OrderProduct`, dispara a cada
save); compra incrementa por **pedido fechado** (`Order.Status → Closed`, uma vez só). São dois
mecanismos, e uma tabela única exigiria `if (isPurchase)` espalhado pelo interceptor/service/form —
o oposto do que já escrevemos em `CLAUDE.md` sobre SOLID/composição em vez de `if/switch` gigante.

**O que SIM vira genérico/compartilhado** — com o shape convergindo (seção 2), essa parte fica
ainda mais natural:

- **Componente de picker de produto**: extrair a lógica hoje presa dentro de
  `order-form.component.ts` (autocomplete SKU/nome + grid inline + validação de quantidade +
  fluxo "produto não encontrado → criar") pra um componente compartilhado novo,
  `shared/components/product-picker-grid` (nome sujeito a ajuste), com:
  - `@Input() filterOutOfStock: boolean` — `true` no form de Pedido de Venda (comportamento atual,
    sem mudança), `false` no de Pedido de Compra (novo, sem essa restrição).
  - `@Output()` emitindo a linha montada (`{ productId, quantity, price, discount }`) pro form pai
    empilhar do jeito que já faz hoje — o componente novo não sabe nada sobre `Order` nem
    `PurchaseOrder`, só sobre `Product`.
  - `order-form.component.ts` passa a consumir esse componente em vez da lógica inline (redução
    real de tamanho do arquivo, não só reaproveito pro novo módulo).
- Todo o resto (`Order`/`OrderProduct` em si, o interceptor de estoque por reserva) fica como uma
  venda simples (seção 2) — nada além disso muda em Pedido de Venda.

## 4. Backend — Pedido de Compra

### 4.1 Modelos novos

```csharp
public class PurchaseOrder : BaseModel
{
    public string PurchaseOrderNumber { get; set; }
    public DateTime Date { get; set; }
    public OrderStatus Status { get; set; }              // reaproveita o enum existente (Open/Closed/WaitingPayment)
    public string Description { get; set; }
    public decimal Price { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal Discount { get; set; }

    [ForeignKey("BusinessPartner")]
    public Guid BusinessPartnerId { get; set; }           // filtrado pra Supplier na tela
    public BusinessPartner BusinessPartner { get; set; }

    [ForeignKey("Transaction")]
    public Guid TransactionId { get; set; }
    public Transaction Transaction { get; set; }

    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<PurchaseOrderProduct> PurchaseOrderProducts { get; set; } = [];
    public ICollection<Attachment> Attachments { get; set; }
}

public class PurchaseOrderProduct : BaseModel
{
    public decimal Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Discount { get; set; }
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public decimal TotalPrice { get; private set; }

    [ForeignKey("PurchaseOrder")]
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; }

    [ForeignKey("Product")]
    public Guid ProductId { get; set; }
    public Product Product { get; set; }
}
```

### 4.2 Incremento de estoque ao fechar o pedido

Novo interceptor `PurchaseOrderStockIncrementingSaveChangesInterceptor.cs` (par do
`StockAdjustingSaveChangesInterceptor.cs` existente, não uma modificação nele): dispara em cima de
mudanças em `PurchaseOrder` onde `Status` original ≠ `Closed` e `Status` novo = `Closed`; soma
`Quantity` de cada `PurchaseOrderProduct` do pedido no `QuantityInStock` do respectivo `Product`.
Roda uma vez (na transição, não a cada save do pedido já fechado).

### 4.3 Services/Controllers/DTOs

`IPurchaseOrderService`/`PurchaseOrderService`, `IPurchaseOrderProductService`/
`PurchaseOrderProductService`, controllers REST espelhando `OrderController`/
`OrderProductController` (mesmo shape de endpoints), DTOs + `MappingProfile.cs`. Sem filtro de
estoque no service/DTO de item — a única regra de negócio que Pedido de Venda tem e Compra não.

### 4.4 Attachment

Nova coluna `PurchaseOrderId` (nullable FK) em `Attachment`, migration, `GetByPurchaseOrderId` em
`AttachmentService.cs`, campo espelho no DTO — mesmo padrão que `OrderId`/`QuoteId`/`TripId` já
seguem ali.

### 4.5 Feature toggle

Novo **grupo** top-level `PurchaseOrdersModule` em `FeatureToggleKeys.cs` (`GroupKey = null`,
mesmo nível de `SalesOrdersModule`/`FleetModule`/etc.) — liga/desliga o módulo inteiro (menu,
rotas, futuros alertas). Entidades dentro do grupo: `PurchaseOrder` (o pedido em si) e
`StockAlert` (o alerta de estoque da navbar, seção 5). Seed em `DatabaseSeeder.cs` com esses três
registros (grupo + 2 entidades).

## 5. Alertas de estoque na navbar

Novo componente `navbar/components/stock-alert-notification/` (mesmo padrão dos outros já
existentes — busca os próprios dados, sem serviço compartilhado):

- **Vermelho (erro)**: produtos com `QuantityInStock <= 0`.
- **Amarelo (warning)**: produtos com `0 < QuantityInStock <= 3`.
- Fonte: `ProductService.getAll()` filtrado client-side (mesmo padrão do
  `VehicleBlockedNotificationComponent` — sem endpoint novo).
- **Clique numa linha**: abre o modal de novo Pedido de Compra
  (`PurchaseOrderFormComponent` em modo Adicionar) com o produto daquela linha já
  pré-selecionado no picker genérico (seção 3) — precisa de um `@Input() preselectedProductId`
  nele.
- **"Ver todos"**: navega pra `/products` com query params (`stockStatus=Low` — inclui os dois
  casos, zerado e baixo, mesma regra "≤ 3" do alerta), mesmo padrão que
  `order-product-notification.component.ts`/`onSeeMore()` já usa hoje pra `/order-products`
  (esse componente sai junto com a locação, seção 2, mas o padrão de navegação com query params
  fica como referência). `ProductsComponent` ainda não lê query params nenhum hoje — vira uma
  leitura nova (`ActivatedRoute.queryParams`).
- Gating: `combineLatest([PurchaseOrdersModule, StockAlert])`, centralizado em
  `NavbarComponent`, mesmo padrão do Spec 1.

## 6. Frontend — novo módulo `purchase-orders`

Espelha `orders` na estrutura:

```
purchase-orders/
  purchase-orders.component.ts          (lista)
  purchase-orders.routes.ts
  components/
    purchase-order-form/                (usa o picker genérico, filterOutOfStock=false)
    purchase-order-details-modal/
    purchase-order-details-page/
```

Sidebar: novo item "Pedido de Compra" sob o mesmo header de Pedidos (ou um novo header, a definir
na review visual), gateado por `isPurchaseOrdersModuleEnabled` (mesmo padrão do fix recém-feito
pra `SalesOrdersModule`/`QuotesModule`). Rota com `data: { featureFlag: 'PurchaseOrdersModule' }`.

## 7. Arquivos a criar/alterar

**Backend:**
- `TSI.Friday.Contracts/.../Models/PurchaseOrder.cs`, `PurchaseOrderProduct.cs` (novos)
- `TSI.Friday.Contracts/.../Models/OrderProduct.cs` (-`StartDate`/`EndDate`/`Status`)
- `TSI.Friday.Contracts/.../Enums/OrderProductStatus.cs` (removido)
- `TSI.Friday.Contracts/.../Models/FeatureToggleKeys.cs` (+`PurchaseOrdersModule`, +`StockAlert`,
  -`RentalReport`, -`OrderProductAlert`)
- `TSI.Friday.Contracts/.../Models/Attachment.cs` (+`PurchaseOrderId`)
- `TSI.Friday.Contracts/.../Interfaces/IPurchaseOrderService.cs`, `IPurchaseOrderProductService.cs`
- `TSI.Friday.Services/.../PurchaseOrderService.cs`, `PurchaseOrderProductService.cs`
- `TSI.Friday.Services/.../OrderProductService.cs`, `OrderService.cs`, `QuoteProductService.cs`
  (remover uso de `OrderProductStatus`)
- `TSI.Friday.Services/.../DashboardService.cs` (card 4 vira placeholder fixo)
- `TSI.Friday.Data/.../Interceptors/StockAdjustingSaveChangesInterceptor.cs` (simplificar, sem
  branches de `Returned`)
- `TSI.Friday.Data/.../Interceptors/PurchaseOrderStockIncrementingSaveChangesInterceptor.cs` (novo)
- `TSI.Friday.Data/.../DatabaseSeeder.cs` (+3 toggles, -2 toggles), migration nova
- `TSI.Friday.Services/.../AttachmentService.cs` (+`GetByPurchaseOrderId`)
- `TSI.Friday.IoC/.../MappingProfile.cs`, DI registration
- `TSI.Friday.WebAPI/.../PurchaseOrderController.cs`, `PurchaseOrderProductController.cs`
- Testes unitários correspondentes em cada projeto `.Tests` (novos + ajustados pela remoção de
  status)

**Frontend:**
- `shared/components/product-picker-grid/` (novo, extraído de `order-form.component.ts`)
- `orders/components/order-form/order-form.component.ts`/`.html` (consome o picker novo)
- `order-products/order-products.component.*` (removido — tela "Relatório de Locações")
- `order-products/components/order-product-form/`, `order-product-details-modal/` (mantidos, sem
  campos de data/status)
- `purchase-orders/` (feature nova completa, ver seção 6)
- `navbar/components/order-product-notification/` (removido)
- `navbar/components/stock-alert-notification/` (novo)
- `navbar/navbar.component.ts`/`.html` (- gating do alerta antigo, + gating do novo)
- `core/models/feature-toggle.model.ts` (+2 chaves, -2 chaves)
- `core/models/order-product.model.ts`, `core/enums/order-product-status.enum.ts` (ajustado/removido)
- `shared/sidebar/sidebar.component.ts`/`.html` (-item Relatório de Locações, +item Pedido de
  Compra)
- `app.routes.ts` (-rota `order-products`, +rota `purchase-orders`)
- `products/products.component.ts`/`.html` (+leitura de `stockStatus` via query params)

## 8. Verificação

1. `dotnet build` + `dotnet test` limpos; `ng build --configuration development` limpo.
2. Pedido de Venda: criar um pedido com produto, sem StartDate/EndDate/status pedidos no form;
   estoque desconta na hora do save; remover o item devolve o estoque.
3. Pedido de Compra: criar com produto **sem estoque nenhum** — não deve bloquear (diferença
   central pedida). Fechar o pedido (`Status → Closed`) — `QuantityInStock` de cada produto sobe
   pela quantidade comprada; reabrir/editar sem trocar o status não incrementa de novo.
4. Alerta de estoque na navbar: produto zerado aparece vermelho, produto com 1-3 aparece amarelo,
   produto com 4+ não aparece. Clicar numa linha abre o modal de Pedido de Compra com o produto
   pré-selecionado. "Ver todos" leva pra `/products?stockStatus=Low` já filtrado.
5. Desligar `PurchaseOrdersModule` no painel — menu, rota e alerta somem juntos; religar, tudo
   volta.
6. Dashboard: 4 cards continuam aparecendo, o 4º com o valor fixo/fictício no lugar de "Devoluções
   em Atraso".
7. Confirmar que "Relatório de Locações" e o alerta "itens de pedido em atraso" não aparecem mais
   em lugar nenhum (menu, navbar, painel de módulos).
