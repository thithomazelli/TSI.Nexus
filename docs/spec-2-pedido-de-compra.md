# Spec 2 — Pedido de Compra

> Escrito antes de qualquer código ser tocado. Segunda de um lote de 4 specs isoladas (3 features +
> 1 ajuste); esta é a primeira feature. Traz uma decisão de modelagem (entidade nova vs. reaproveitar
> `Order`/`OrderProduct`) que precisa de validação explícita antes de codar — ver seção 2.

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

## 2. Decisão de modelagem — pra validar antes de codar

**Pedido de Compra ganha entidades próprias (`PurchaseOrder`/`PurchaseOrderProduct`), não
reaproveita `Order`/`OrderProduct` genericizados.** Motivo:

1. `OrderProduct` carrega `StartDate`/`EndDate` e o ciclo `InProgress → Delayed → Returned`, que é
   semântica de **locação** — não existe em compra (recebe o produto, acabou). Forçar isso a
   servir os dois casos significa campos nullable sem sentido num dos dois lados e um enum de
   status que mente pra metade dos usos.
2. O **gatilho de ajuste de estoque é fundamentalmente diferente**: venda reserva por **item
   adicionado** (interceptor em cima de `OrderProduct`); compra incrementa por **pedido fechado**
   (`Order.Status → Closed`, uma vez, todos os itens de uma vez). São dois mecanismos, não uma
   variação de parâmetro do mesmo mecanismo.
3. Forçar os dois dentro da mesma tabela ia exigir `if (isPurchase) / else` espalhado pelo
   interceptor, pelo service e pelo formulário — o oposto do que acabamos de escrever em
   `CLAUDE.md` sobre SOLID/composição em vez de `if/switch` gigante.

**O que SIM vira genérico/compartilhado** (isso é o pedido de "mostrar pra avaliar" — meu
encaminhamento é assumir o design abaixo e seguir, mas depende do seu ok):

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
- Todo o resto (`Order`/`OrderProduct` em si, o interceptor de estoque por reserva, o ciclo de
  locação) fica exatamente como está — nada nessa spec toca em Pedido de Venda além dessa extração
  do picker.

## 3. Backend

### 3.1 Modelos novos

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

Sem `StartDate`/`EndDate`, sem status por item — reflete que é só "quantidade comprada desse
produto nesse pedido". Reaproveita `OrderStatus` (mesmos três valores fazem sentido pro fluxo de
compra: Aberto/Fechado/Aguardando Pagamento).

### 3.2 Incremento de estoque ao fechar o pedido

Novo interceptor `PurchaseOrderStockIncrementingSaveChangesInterceptor.cs` (par do
`StockAdjustingSaveChangesInterceptor.cs` existente, não uma modificação nele): dispara em cima de
mudanças em `PurchaseOrder` onde `Status` original ≠ `Closed` e `Status` novo = `Closed`; soma
`Quantity` de cada `PurchaseOrderProduct` do pedido no `QuantityInStock` do respectivo `Product`.
Roda uma vez (na transição, não a cada save do pedido já fechado).

### 3.3 Services/Controllers/DTOs

`IPurchaseOrderService`/`PurchaseOrderService`, `IPurchaseOrderProductService`/
`PurchaseOrderProductService`, controllers REST espelhando `OrderController`/
`OrderProductController` (mesmo shape de endpoints), DTOs + `MappingProfile.cs`. Sem filtro de
estoque no service/DTO de item — a única regra de negócio que Pedido de Venda tem e Compra não.

### 3.4 Attachment

Nova coluna `PurchaseOrderId` (nullable FK) em `Attachment`, migration, `GetByPurchaseOrderId` em
`AttachmentService.cs`, campo espelho no DTO — mesmo padrão que `OrderId`/`QuoteId`/`TripId` já
seguem ali.

### 3.5 Feature toggle

Novo **grupo** top-level `PurchaseOrdersModule` em `FeatureToggleKeys.cs` (`GroupKey = null`,
mesmo nível de `SalesOrdersModule`/`FleetModule`/etc.) — liga/desliga o módulo inteiro (menu,
rotas, futuros alertas). Entidades dentro do grupo: `PurchaseOrder` (o pedido em si) e
`StockAlert` (o alerta de estoque da navbar, seção 4). Seed em `DatabaseSeeder.cs` com esses três
registros (grupo + 2 entidades).

## 4. Alertas de estoque na navbar

Novo componente `navbar/components/stock-alert-notification/` (mesmo padrão dos outros 4 já
existentes — busca os próprios dados, sem serviço compartilhado):

- **Vermelho (erro)**: produtos com `QuantityInStock <= 0`.
- **Amarelo (warning)**: produtos com `0 < QuantityInStock <= 3`.
- Fonte: `ProductService.getAll()` filtrado client-side (mesmo padrão do
  `VehicleBlockedNotificationComponent` — sem endpoint novo).
- **Clique numa linha**: abre o modal de novo Pedido de Compra
  (`PurchaseOrderFormComponent` em modo Adicionar) com o produto daquela linha já
  pré-selecionado no picker genérico (seção 2) — precisa de um `@Input() preselectedProductId`
  nele.
- **"Ver todos"**: navega pra `/products` com query params (`stockStatus=Low` — inclui os dois
  casos, zerado e baixo, mesma regra "≤ 3" do alerta), mesmo padrão que
  `order-product-notification.component.ts`/`onSeeMore()` já usa hoje pra `/order-products`.
  `ProductsComponent` ainda não lê query params nenhum hoje — vira uma leitura nova (`ActivatedRoute
  .queryParams`), seguindo o mesmo padrão que `order-products.component.ts` já usa pra `status`.
- Gating: `combineLatest([PurchaseOrdersModule, StockAlert])`, centralizado em
  `NavbarComponent`, mesmo padrão do Spec 1.

## 5. Frontend — novo módulo `purchase-orders`

Espelha `orders`/`order-products` 1:1 na estrutura:

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

## 6. Arquivos a criar/alterar

**Backend:**
- `TSI.Friday.Contracts/.../Models/PurchaseOrder.cs`, `PurchaseOrderProduct.cs` (novos)
- `TSI.Friday.Contracts/.../Models/FeatureToggleKeys.cs` (+`PurchaseOrdersModule`, +`StockAlert`)
- `TSI.Friday.Contracts/.../Models/Attachment.cs` (+`PurchaseOrderId`)
- `TSI.Friday.Contracts/.../Interfaces/IPurchaseOrderService.cs`, `IPurchaseOrderProductService.cs`
- `TSI.Friday.Services/.../PurchaseOrderService.cs`, `PurchaseOrderProductService.cs`
- `TSI.Friday.Data/.../Interceptors/PurchaseOrderStockIncrementingSaveChangesInterceptor.cs` (novo)
- `TSI.Friday.Data/.../DatabaseSeeder.cs` (+3 toggles), migration nova
- `TSI.Friday.Services/.../AttachmentService.cs` (+`GetByPurchaseOrderId`)
- `TSI.Friday.IoC/.../MappingProfile.cs`, DI registration
- `TSI.Friday.WebAPI/.../PurchaseOrderController.cs`, `PurchaseOrderProductController.cs`
- Testes unitários correspondentes em cada projeto `.Tests`

**Frontend:**
- `shared/components/product-picker-grid/` (novo, extraído de `order-form.component.ts`)
- `orders/components/order-form/order-form.component.ts`/`.html` (consome o picker novo em vez da
  lógica inline)
- `purchase-orders/` (feature nova completa, ver seção 5)
- `navbar/components/stock-alert-notification/` (novo)
- `navbar/navbar.component.ts`/`.html` (+ gating do alerta novo)
- `core/models/feature-toggle.model.ts` (+2 chaves)
- `shared/sidebar/sidebar.component.ts`/`.html` (+item novo)
- `app.routes.ts` (+rota `purchase-orders`, guard)
- `products/products.component.ts`/`.html` (+leitura de `stockStatus` via query params)

## 7. Verificação

1. `dotnet build` + `dotnet test` limpos; `ng build --configuration development` limpo.
2. Criar Pedido de Compra com produto sem estoque nenhum — não deve bloquear (diferença central
   pedida).
3. Fechar o pedido (`Status → Closed`) — `QuantityInStock` de cada produto do pedido sobe pela
   quantidade comprada; reabrir/editar sem trocar o status não deve incrementar de novo.
4. Alerta da navbar: produto zerado aparece vermelho, produto com 1-3 aparece amarelo, produto com
   4+ não aparece. Clicar numa linha abre o modal de Pedido de Compra com o produto pré-selecionado.
   "Ver todos" leva pra `/products?stockStatus=Low` com a lista já filtrada.
5. Desligar `PurchaseOrdersModule` no painel — menu, rota e alerta somem juntos; religar, tudo
   volta.
6. Regressão em Pedido de Venda: form continua bloqueando produto sem estoque, autocomplete e
   fluxo "produto não encontrado → criar" continuam funcionando idênticos a antes da extração do
   picker genérico.
