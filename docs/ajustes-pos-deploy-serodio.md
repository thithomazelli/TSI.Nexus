# Ajustes pós-deploy serodioturismo — desenho consolidado

> Escrito depois do primeiro deploy real do branch `serodioturismo` em produção
> (`serodio-app.nexusoperations.com.br`), a partir de bugs/pedidos reportados testando o app ao
> vivo. Cada item já foi investigado no código antes de entrar aqui — a seção descreve a causa
> raiz encontrada e a solução, não só o sintoma reportado.

## 1. Card "Devoluções em Atraso" com acentuação quebrada

**Causa raiz:** 5 arquivos C# do repo estavam salvos em Latin-1/CP1252 em vez de UTF-8
(`DashboardService.cs`, `QuoteProductService.cs`, e 3 arquivos de teste correspondentes) — os
bytes de "ç"/"õ"/"á" etc. ficaram fisicamente errados no arquivo-fonte, não é um problema de
transmissão/runtime. `DashboardService.cs` é exatamente a origem do título "Devoluções em Atraso"
mostrado no card.

**Fix:** reconverter os 5 arquivos para UTF-8 real (bytes corrigidos, mesmo conteúdo). Build e
testes conferidos depois da conversão.

## 2. Master deve enxergar TUDO no sidebar (mudança de desenho)

**Contexto:** o desenho original (`docs/feature-toggle-design.md`, seção 2) definia Master como
papel **não hierárquico** com Admin — só o painel de toggle, nada mais. Isso mudou agora: Master
deve ver e acessar tudo que Admin vê, mais o painel de Módulos.

**Causa raiz do sintoma:** o bloco inteiro de "Financeiro"/"Admin" no sidebar (Transações,
Pagamentos, Despesas, Relatórios, Usuários, Templates de Documentos) é `*ngIf="isAdmin"` só —
Master nunca entra ali. E mesmo corrigindo só o sidebar, as ROTAS por trás continuam bloqueando:
`AuthorizationGuard` com `data: { roles: ['Admin'] }` em `document-templates`, `payments`,
`reports` (2x), `transactions`, `users` (2x) — e no backend, `UsersController`,
`OverdueController`, `VehicleMaintenanceOverdueController` (`[Authorize(Roles = "Admin")]`) e
`DocumentTemplatesController` (`[Authorize(Policy = "RequireAdmin")]`) também exigem
especificamente o role Admin.

**Fix:**
- Sidebar: `*ngIf="isAdmin || isMaster"` no bloco Financeiro/Admin.
- Rotas Angular: adicionar `'Master'` no array `roles` de cada rota listada acima
  (`AuthorizationGuard` já usa `.some()` — é só incluir o role extra).
- Backend: `[Authorize(Roles = "Admin,Master")]` nos 4 controllers listados, e a policy
  `RequireAdmin` (`Program.cs`) passa a `policy.RequireRole("Admin", "Master")`.
- `Transactions`/`Payments` controllers já são só `[Authorize]` (qualquer autenticado) — não
  precisam de mudança.

## 3. Modais (Angular Material `mat-dialog-container`) — tamanho/scroll quebrado

**Atualizado (screenshots confirmam):** não é só o modal de Orçamento de Viagem — o mesmo padrão
quebrado aparece no modal "Adicionar Pedido" e outros. Em telas menores o conteúdo estoura o
modal, o scroll não entra, e os botões Cancelar/Salvar somem completamente (nem ficam visíveis
rolando).

**Padrão esperado:** o modal cresce proporcionalmente ao conteúdo até um limite baseado no
tamanho da tela; ao atingir esse limite, só a área central (os campos) ganha scroll vertical —
título e botões ficam sempre fixos/visíveis, nunca saem de tela.

Primeira correção (no `quote-form`, já commitada) mexeu só na extensão do
`.modal-scrollable-area` daquele componente — insuficiente, porque o problema é estrutural/CSS
no nível do container do dialog do Angular Material, não só daquele formulário. Fix real:
- CSS global no container do `mat-dialog`/`.custom-modal`: `max-height` relativo à viewport,
  layout flex com header e footer fixos e só a área do meio (`.modal-scrollable-area`) rolando.
- Auditar cada formulário em modal (Orçamento, Viagem, Pedido, Cliente, etc.) pra garantir que
  todos os campos — incluindo pagamento/transação — fiquem dentro de `.modal-scrollable-area`,
  e os botões de ação sempre fora, no rodapé fixo.

## 4. Campo de data não permite digitar (regressão)

**Causa raiz provável:** commit `87463e0` ("Corrige app-date-field não atualizar o formulário ao
digitar a data") passou a chamar `this.onChange(formatted)` a cada tecla digitada dentro de
`onDateInput()`. O input nativo tem **dois** controladores de valor simultâneos no mesmo
elemento: o `[value]="value"` + handlers manuais deste componente, e a diretiva
`[matDatepicker]="picker"` do Angular Material (que também escuta `input` nativamente pra tentar
parsear a data digitada com o `DateAdapter`). Nomeio como hipótese principal a ser confirmada
com teste real no navegador: o parser do Material rejeita o valor parcial (ex.: "12/") e força o
campo de volta pra um estado vazio/anterior, dando a impressão de "não deixa digitar".

**Fix:** validar a hipótese rodando o form real (Playwright) e, confirmado, desacoplar a
digitação manual do parsing do `MatDatepickerInput` (ex.: não usar `[matDatepicker]` diretamente
no mesmo `<input>` que já tem máscara manual — plugar o datepicker num input oculto/proxy, ou
usar `[matDatepickerFilter]`/parse config compatível com o formato `DD/MM/AAAA` mascarado).

## 5. Calendário (date picker) sem os dias — CSS quebrado

A ser confirmado com Playwright antes de mexer — o painel abre (mês/ano aparecem) mas a grade de
dias não renderiza. Provável CSS custom (`panelClass="pt-br-datepicker"`) conflitando com as
classes internas do Angular Material que desenham a grade (`mat-calendar-body`, etc.), ou um
`overflow`/`display` cortando o conteúdo.

## 6. Modal "Adicionar Cliente" sem opção de adicionar endereço

**Causa raiz:** `canDisplayNewAddressLink` (controla se aparece o link "adicionar endereço" em
vez do form de endereço já aberto) só é setado em `setCanDisplayAddressFormAndAddressLink()`
dentro de `if (this.isEdit)` — no modo Add (criar cliente novo) o método não faz nada, e os
valores default (`canDisplayAddressForm = true`, `canDisplayNewAddressLink = false`) fazem o
form de endereço aparecer sempre aberto, sem a opção de link.

**Fix:** no modo Add (`!isEdit`), inicializar `canDisplayAddressForm = false` e
`canDisplayNewAddressLink = true` — mesmo padrão que o resto do componente já usa depois de
salvar um endereço (linha 298: `canDisplayAddressForm = canDisplayNewAddressLink ? true : false`).
Modo edit não muda.

## 7. Painel "Módulos" (dentro de "Configuração", ver item 10) — granularidade por entidade + por grupo

Hoje só existe 1 toggle (`FleetModule`) controlando um bloco monolítico de entidades. Pedido:
listar **todas** as entidades do sistema, com duas visões em tabs:

- **Visão agrupada** (a atual): liga/desliga por grupo (ex.: "Frota/Viagens" = Trip, TripLeg,
  Passenger, Driver, Vehicle, FuelLog, VehicleMaintenance, ServiceOrder, Commission, Quotes tipo
  Viagem — já existe). Novos grupos a criar: **Financeiro/Relatórios** (Transaction, Payment,
  reports), **Orçamentos** (Quote tipo Produto), **Pedidos de Venda** (Order), **Anexos**
  (Attachment), e o que mais fizer sentido conforme mapear as entidades restantes.
- **Visão detalhada** (nova): mesma lista, mas por entidade individual dentro de cada grupo,
  pra controle fino.

**Desenho técnico:** `FeatureToggle` ganha uma coluna `GroupKey` (nullable) — toggles de entidade
apontam pro grupo a que pertencem; toggles de grupo continuam como estão (sem `GroupKey`, ou
`GroupKey == Key`, a definir na implementação). A visão agrupada consome só os toggles de grupo;
a visão detalhada consome os toggles de entidade, agrupados por `GroupKey` pra exibição. Cada
serviço de domínio passa a checar o toggle da SUA entidade especificamente, com fallback pro
toggle do grupo quando a entidade não tem override próprio (evita ter que reconfigurar toggle
por toggle pra quem só quer ligar/desligar o grupo inteiro).

## 8. Dados do seed inicial não aparecem em nenhuma tela (Clientes vazio etc.)

**Não é bug — é o comportamento desenhado.** `DemoDataSeeder` (dados fake via Bogus: parceiros de
negócio, produtos, orçamentos etc.) só roda se `SeedDemoData=true` no config **e**
`!Environment.IsProduction()` — trava dupla, a segunda inclusive documentada como proposital
("nunca em Production, mesmo que a flag seja setada por engano"). Em produção só o
`DatabaseSeeder` (roles, usuários Admin/Thiago/Leonardo, o toggle FleetModule) e o
`DocumentTemplateSeeder` (templates de PDF) rodam — por isso a tela de Clientes aparece vazia:
não existe nenhum parceiro de negócio real cadastrado ainda, e o seed de demonstração
deliberadamente não popula produção com dados fake misturados aos reais.

**Decisão:** manter a trava como está (não desligar a proteção de produção sem pedido explícito
seu — misturar dados fake com dados reais de cliente é difícil de reverter depois). Se quiser
dados de exemplo em produção, isso é uma decisão separada, sua, não algo pra eu decidir sozinho.

## 9. Dark mode + i18n (pt-BR / en / es)

Duas features novas, ambas armadas na caixa de perfil do usuário (dropdown) e na tela de
perfil, com preferência **persistida no perfil do usuário** (nova coluna/campo) e carregada no
login.

- **Dark mode:** tokens de cor via CSS custom properties (`:root` + `[data-theme="dark"]`),
  cobrindo o AdminLTE + componentes custom da aplicação. Toggle rápido na caixa de perfil.
- **i18n:** `@ngx-translate/core` (ou `@angular/localize`, a decidir na implementação pelo que
  for menos invasivo pro código já existente) com chaves de tradução pt-BR/en/es. Escopo: telas
  e componentes compartilhados primeiro (sidebar, formulários mais usados, mensagens de
  notificação); strings hardcoded remanescentes migram incrementalmente.
- Ambas as preferências (`theme`, `language`) ficam no `User` (backend) e no perfil retornado no
  login/refresh-token, aplicadas no bootstrap do app.

## 10. Área "Master" do sidebar vira "Configuração"

Renomeia o item/grupo do sidebar de "Master" pra "Configuração". Dentro dela:
- Painel de módulos (item 7 acima), como já planejado.
- **Controle de alertas** (novo escopo): quais alertas o sistema dispara e sob quais condições —
  a ser mapeado a partir do que já existe (ex.: manutenção de veículo vencida/a vencer,
  "Devoluções em Atraso" do dashboard, licença de transporte a vencer) e transformado em
  configuração editável em vez de fixo no código.

---

**Status:** implementação em andamento, sem interrupções, conforme pedido. Ao final, entrego uma
tabela completa com todos os itens e o status de cada um pra você conferir.
