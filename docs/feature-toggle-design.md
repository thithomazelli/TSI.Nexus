# Unificação serodio + main via feature toggle — desenho consolidado

> Referência de implementação. Escrito antes de qualquer código ser tocado; serve tanto pra
> alinhamento com o time quanto de espelho pra quem for implementar (inclusive pra mim mesmo,
> em sessões futuras).

## 1. Objetivo

Hoje `serodioturismo` e `main` são branches que divergiram (a `serodioturismo` tem um módulo de
frota/viagens que a `main` não tem, e nem deve ter pra todo cliente). Manter as duas em paralelo
exige um trabalho manual de "de/para" toda vez que algo genérico precisa ir de uma pra outra
(foi exatamente o trabalho feito na `serodio-main-pack`).

A proposta: **uma branch só**, com o módulo de frota/viagem inteiro por trás de um **feature
toggle**. Clientes que não precisam de gestão de frota simplesmente deixam o módulo desligado —
o sistema deles fica idêntico ao que a `main` oferece hoje.

Ordem de implementação combinada: tudo é construído e testado na `serodioturismo`; só depois de
validado é que vai pra `main`.

## 2. Papéis de usuário (3, em vez de 2)

| Papel | Quem | Acesso |
|---|---|---|
| **Master** | Só o usuário master, criado automaticamente no seed inicial (`DatabaseSeeder`) | **Só** o painel administrativo de ligar/desligar módulos. Não é hierárquico com Admin — é um papel à parte, focado só nisso. |
| **Admin** | Usuários administrativos do cliente | Acesso total ao sistema **exceto** o painel de toggle. |
| **Usuário** | Equivalente ao "User" de hoje | Acesso limitado, como já é hoje. |

Implementação: nova `IdentityRole("Master")` + policy `RequireMaster` (mesmo padrão de
`RequireAdmin` já existente em `Program.cs`). `DatabaseSeeder.SeedAsync` passa a garantir também
a role Master e um usuário master, do mesmo jeito que já garante Admin hoje.

## 3. Regra do feature toggle

- Só o **Master** liga/desliga módulos.
- **Módulo desligado = tudo relacionado some, em todo lugar**: sidebar, guards de rota do
  Angular, **e as respostas da API** — não filtrar só na tela, senão dá pra ver os dados abrindo
  a aba de rede do navegador. Os serviços de backend (`FindAll` etc.) precisam checar a flag e
  excluir os registros do módulo desligado da resposta.
- **Nenhum dado é apagado.** Fica só fora do filtro enquanto desligado; volta a aparecer
  normalmente assim que o módulo é religado.
- Vale pro módulo de Viagem/Frota inteiro (`Trip`, `TripLeg`, `Passenger`, `Driver`, `Vehicle`,
  `FuelLog`, `VehicleMaintenance`, `ServiceOrder`, `Commission`) **e também** pros Orçamentos do
  tipo Viagem (`Quote.Type == QuoteType.Trip`).

## 4. `Order` fica exatamente como está na `main` hoje

Nada de `Route`, `DistanceKm`, `VehicleId`, `DriverId` etc. direto no `Order` — isso é
exatamente o acoplamento que gerou o trabalho de "de/para" até agora. Tudo que é
específico de viagem vai pra uma entidade **totalmente separada**, sem FK nenhuma entre as duas.

## 5. `Trip` — entidade raiz, independente de `Order`

Não é uma extensão de `Order` (isso foi cogitado e descartado — ver seção 8). É uma entidade de
primeiro nível, com seu próprio cliente, preço e transação, do mesmo jeito que `Order` e `Quote`
já são hoje.

```csharp
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using TSI.Nexus.Contracts.Enums;

namespace TSI.Nexus.Contracts.Models
{
    public class Trip : BaseModel
    {
        public string TripNumber { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public OrderStatus Status { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public decimal Discount { get; set; }

        [ForeignKey("BusinessPartner")]
        public Guid BusinessPartnerId { get; set; }

        public virtual BusinessPartner BusinessPartner { get; set; } = null!;

        public string Route { get; set; } = string.Empty;

        public decimal DistanceKm { get; set; }

        public int DailyCount { get; set; }

        public string TransportLicenseNumber { get; set; }

        public DateTime? TransportLicenseExpiryDate { get; set; }

        [ForeignKey("Vehicle")]
        public Guid? VehicleId { get; set; }

        public virtual Vehicle? Vehicle { get; set; }

        [ForeignKey("Driver")]
        public Guid? DriverId { get; set; }

        public virtual Driver? Driver { get; set; }

        [ForeignKey("Transaction")]
        public Guid TransactionId { get; set; }

        public virtual Transaction Transaction { get; set; } = null!;

        public virtual ICollection<Payment>? Payments { get; set; } = new List<Payment>();

        public virtual ICollection<TripLeg> TripLegs { get; set; } = new List<TripLeg>();

        public virtual ICollection<Passenger> Passengers { get; set; } = new List<Passenger>();

        public virtual ICollection<Attachment> Attachments { get; set; }
    }
}
```

Notas de decisão:
- `Status` reaproveita o enum `OrderStatus` (Open/Closed/WaitingPayment) em vez de criar um
  `TripStatus` quase idêntico — só criar um novo enum se surgir um estado que não faça sentido
  pra `Order`.
- `TripNumber`: sugestão `{prefix}-V{n:D5}` (mesmo padrão de `PED-`/`ORC-Q`, troca só a letra),
  via `Sequence` com chave nova `"TripNumberSeq"`. **Ainda não confirmado com o time.**

## 6. `Transaction` / `Payment` ganham `TripId` opcional

Já existe o precedente exato — os dois já têm `OrderId`/`BusinessPartnerId` como `Guid?`, ou
seja, já suportam transação/pagamento sem nenhum `Order` atrelado. É só espelhar:

```diff
 [ForeignKey("Order")]
 public Guid? OrderId { get; set; }
 public Order Order { get; set; }
+
+[ForeignKey("Trip")]
+public Guid? TripId { get; set; }
+public Trip? Trip { get; set; }
```

(em `Transaction.cs` e `Payment.cs`, do mesmo jeito que já está pra `Order`.)

## 7. `TripLeg` / `Passenger` / `ServiceOrder` apontam pra `Trip`, não mais pra `Order`

```diff
-[ForeignKey("Order")]
-public Guid OrderId { get; set; }
-public virtual Order Order { get; set; } = null!;
+[ForeignKey("Trip")]
+public Guid TripId { get; set; }
+public virtual Trip Trip { get; set; } = null!;
```

Mesmo comentário `// Not [Required]: ...` que já existe em `TripLeg`/`Passenger` continua válido,
só troca `Order`→`Trip`. Construtores idem:

```diff
-public TripLeg(Order order)
-{
-    Order = order ?? throw new ArgumentNullException(nameof(order));
-    OrderId = order.Id;
-}
+public TripLeg(Trip trip)
+{
+    Trip = trip ?? throw new ArgumentNullException(nameof(trip));
+    TripId = trip.Id;
+}
```

`ServiceOrder.OrderId`/`Order` viram `TripId`/`Trip` do mesmo jeito. `DriverId`/`VehicleId`
continuam soltos em `ServiceOrder` (não derivam de `Trip.DriverId`) — se o motorista/veículo do
`Trip` mudar depois, a OS já emitida não é reescrita retroativamente.

`Commission`, `FuelLog`, `VehicleMaintenance` **não mudam nada** — já são independentes de
`Order`/`Trip` (só referenciam `ServiceOrder`/`Vehicle`).

## 8. Por que `Trip` não referencia `Order` (opção descartada)

Considerado e descartado: `Trip` com `OrderId` opcional, pendurado no pedido comercial. Descartado
porque a ideia central é isolar completamente o módulo de viagem — inclusive dos Orçamentos e
Pedidos que não são de viagem. Um cliente sem o módulo de Frota nunca deveria ter *nenhum* traço
do conceito de "viagem" em `Order`/`Quote`, nem como FK opcional não usada.

## 9. `Quote` — dois tipos isolados, não um formulário só

```csharp
public enum QuoteType
{
    Product,
    Trip,
}
```

```diff
 public QuoteStatus Status { get; set; }
+
+public QuoteType Type { get; set; }
```

- **Dois pontos de entrada separados** na listagem de Orçamentos ("Novo Orçamento de Produto" /
  "Novo Orçamento de Viagem"), cada botão já abre o formulário certo com o `Type` correspondente
  pré-definido — não é um seletor dentro de um formulário único.
- **Visibilidade de cada botão segue o feature toggle** do módulo correspondente: os dois módulos
  ligados → os dois botões aparecem; só um ligado → só esse aparece.
- Dados de viagem do orçamento vivem numa entidade separada, `QuoteTrip` (1:1 com `Quote`,
  mesmos campos de rota/veículo/motorista/datas que `Trip` tem) — pelo mesmo motivo da seção 8:
  `Quote` não pode carregar colunas de viagem não usadas pra quem não tem o módulo.
- **Conversão**: `QuoteService` bifurca pelo `Type` — `Type == Product` chama
  `ConvertToOrder` (como hoje); `Type == Trip` chama um novo `ConvertToTrip`, que cria o `Trip`
  a partir do `QuoteTrip` (mesma lógica de hoje que converte `QuoteProduct` → `OrderProduct`).

## 10. Frontend

- `FeatureFlagService` + guards espelhando o `AuthorizationGuard` já existente
  (`canActivateChild`), só que checando a flag do módulo em vez de role.
- Sidebar com `*ngIf` na mesma flag.
- `order.model.ts` volta a ficar idêntico ao da `main` (perde os campos de viagem).
- Novo `trip.model.ts` (mesmo formato de `driver.model.ts`/`trip-leg.model.ts`), novo
  `quote-trip.model.ts`.
- `trip-leg.model.ts`/`passenger.model.ts` trocam `orderId` por `tripId`.
- Telas/modais/botões seguem os padrões já estabelecidos no projeto (`.btn-outline-primary`,
  `.btn-sm`, `.modal-scrollable-area`, `[appClick]` no submit, `app-date-field`, etc.) — sem
  inventar padrão novo.

## 11. Migration

Uma migration cobrindo: criar `Trip` e `QuoteTrip`; tirar as 7 colunas de viagem do `Order`
(volta ao shape da master); `TripLeg`/`Passenger`/`ServiceOrder.OrderId` → `TripId`;
`Transaction`/`Payment` ganham `TripId` opcional; `Quote` ganha `Type`.

**Em aberto:** se já existir base de produção rodando com pedidos de viagem reais, isso não é só
`DROP`/`ADD COLUMN` — precisa de um passo de backfill (criar `Trip` pra cada `Order` que hoje tem
`VehicleId`/`DriverId`/`Route`, e repontar as FKs de `TripLeg`/`Passenger`/`ServiceOrder`). Ainda
não confirmado se esse cenário existe.

## 12. Itens ainda em aberto

- Formato exato do `TripNumber` (`{prefix}-V{n:D5}` é sugestão, não confirmado).
- UX exata do painel de toggle do Master.
- Estratégia de backfill de dado real, se aplicável.
- Nome/rota exatos dos novos endpoints (`TripsController`, `QuoteTripsController`?).
