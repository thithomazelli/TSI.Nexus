# Ajustes pós-deploy serodioturismo — desenho consolidado

> Escrito depois do primeiro deploy real do branch `serodioturismo` em produção
> (`serodio-app.nexusoperations.com.br`), a partir de bugs/pedidos reportados testando o app ao
> vivo. Cada item já foi investigado no código antes de entrar aqui — a seção descreve a causa
> raiz encontrada e a solução, não só o sintoma reportado.

## 1. Card "Devoluções em Atraso" com acentuação quebrada

**Implementado.** **Causa raiz:** 5 arquivos C# do repo estavam salvos em Latin-1/CP1252 em vez de UTF-8
(`DashboardService.cs`, `QuoteProductService.cs`, e 3 arquivos de teste correspondentes) — os
bytes de "ç"/"õ"/"á" etc. ficaram fisicamente errados no arquivo-fonte, não é um problema de
transmissão/runtime. `DashboardService.cs` é exatamente a origem do título "Devoluções em Atraso"
mostrado no card.

**Fix:** reconverter os 5 arquivos para UTF-8 real (bytes corrigidos, mesmo conteúdo). Build e
testes conferidos depois da conversão.

## 2. Master deve enxergar TUDO no sidebar (mudança de desenho)

**Implementado.** **Contexto:** o desenho original (`docs/feature-toggle-design.md`, seção 2) definia Master como
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

**Implementado.** **Atualizado (screenshots confirmam):** não é só o modal de Orçamento de Viagem — o mesmo padrão
quebrado aparece no modal "Adicionar Pedido" e outros. Em telas menores o conteúdo estoura o
modal, o scroll não entra, e os botões Cancelar/Salvar somem completamente (nem ficam visíveis
rolando).

**Padrão esperado:** o modal cresce proporcionalmente ao conteúdo até um limite baseado no
tamanho da tela; ao atingir esse limite, só a área central (os campos) ganha scroll vertical —
título e botões ficam sempre fixos/visíveis, nunca saem de tela.

Primeira correção (no `quote-form`, já commitada) mexeu só na extensão do
`.modal-scrollable-area` daquele componente — insuficiente, porque o problema é estrutural/CSS
no nível do container do dialog do Angular Material, não só daquele formulário.

**Fix aplicado (`styles.scss`):** a `.mat-mdc-dialog-surface` de todo modal com `panelClass:
"custom-modal"` virou um container flex-column limitado a `max-height: 90vh` (95vh/full-width em
telas < 600px). Dentro dela, qualquer filho direto que não seja `.modal-scrollable-area` (título,
alert-banner, linha de botões Cancelar/Salvar) ganhou `flex-shrink: 0` — mantém altura natural e
nunca some da tela. Só `.modal-scrollable-area` cresce pra ocupar o espaço restante e rola por
conta própria quando o conteúdo não cabe. Validado com um teste estático (Playwright, DOM
replicando a estrutura real) confirmando que o botão de ação continua visível e a área central
ganha scroll interno mesmo com conteúdo bem maior que a viewport. Escopo global — cobre todos os
~19 formulários em modal do app, não só Orçamento/Pedido.

## 4. Campo de data não permite digitar (regressão)

**Causa raiz confirmada:** commit `87463e0` ("Corrige app-date-field não atualizar o formulário ao
digitar a data") passou a chamar `this.onChange(formatted)` a cada tecla digitada dentro de
`onDateInput()`. O input nativo tinha **dois** controladores de valor simultâneos no mesmo
elemento: o `[value]="value"` + handlers manuais deste componente, e a diretiva
`[matDatepicker]="picker"` do Angular Material (que também escuta `input` nativamente pra tentar
parsear a data digitada com o `DateAdapter`) — o parser do Material rejeitava o valor parcial
(ex.: "12/") e forçava o campo de volta pra um estado vazio/anterior.

**Fix (implementado):** `[matDatepicker]="picker"` foi movido do `<input>` visível mascarado para
um `<input>` proxy oculto dedicado só ao fluxo de seleção via calendário
(`date-field.component.html`). O input visível agora só é controlado pela máscara manual do
componente, sem o parser do Material competindo por ele.

## 5. Calendário (date picker) sem os dias — CSS quebrado

**Causa raiz confirmada:** o app não carregava nenhum tema do Angular Material — sem
`@include mat.theme(...)`, os estilos internos que desenham a grade de dias
(`mat-calendar-body` etc.) não existiam, então o painel abria com mês/ano mas sem os dias.

**Fix (implementado):** adicionado `@use "@angular/material" as mat;` + `@include mat.theme(...)`
no `styles.scss` (paleta azure, tipografia Roboto, density 0), namespaced sob `.mat-*`/`.mdc-*`
então convive sem conflito com Bootstrap/AdminLTE.

## 6. Modal "Adicionar Cliente" sem opção de adicionar endereço

**Implementado.** **Causa raiz:** `canDisplayNewAddressLink` (controla se aparece o link "adicionar endereço" em
vez do form de endereço já aberto) só é setado em `setCanDisplayAddressFormAndAddressLink()`
dentro de `if (this.isEdit)` — no modo Add (criar cliente novo) o método não faz nada, e os
valores default (`canDisplayAddressForm = true`, `canDisplayNewAddressLink = false`) fazem o
form de endereço aparecer sempre aberto, sem a opção de link.

**Fix:** no modo Add (`!isEdit`), inicializar `canDisplayAddressForm = false` e
`canDisplayNewAddressLink = true` — mesmo padrão que o resto do componente já usa depois de
salvar um endereço (linha 298: `canDisplayAddressForm = canDisplayNewAddressLink ? true : false`).
Modo edit não muda.

## 7. Painel "Módulos" (dentro de "Configuração", ver item 10) — granularidade por entidade + por grupo

**Implementado.** Antes só existia 1 toggle (`FleetModule`) controlando um bloco monolítico de entidades. Pedido:
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

**Resolvido — não é bug, é o comportamento desenhado.** `DemoDataSeeder` (dados fake via Bogus: parceiros de
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

**Implementado** (com um ajuste de desenho no i18n, ver abaixo). Ambas as preferências ficam em
`User.Theme`/`User.Language` (backend), voltam no `UserDto` do login/refresh, e um novo endpoint
`PUT /api/Account/preferences` (self-service, sempre o próprio usuário autenticado) grava
alterações. Controles em dois lugares, como pedido: caixa de perfil (dropdown do navbar) e uma
nova aba "Preferências" na tela de perfil do próprio usuário (`/users/:id`, só aparece quando é
o seu próprio perfil).

- **Dark mode:** em vez de tokens CSS próprios, aproveitou o suporte nativo do Bootstrap 5.3
  (`data-bs-theme="dark"` no `<html>`) — o AdminLTE 4 já vem com CSS `[data-bs-theme=dark]`
  completo para sidebar/navbar/cards/forms/tabelas, então a área logada ganha cobertura de dark
  mode quase de graça. `ThemeService` aplica o atributo, persiste local (localStorage, pra não
  "piscar" claro antes do login carregar) e no perfil do usuário. O container do modal do
  Angular Material (que tinha fundo branco fixo) passou a usar `var(--bs-body-bg)`/
  `var(--bs-body-color))` pra não ficar ilegível no escuro.
- **i18n — ajuste de desenho:** `@ngx-translate/core` ainda não tem release compatível com
  Angular 21 (usado neste projeto). Implementei um `TranslationService` + pipe `translate`
  próprios, leves, sem dependência externa — mesmo conceito (dicionários por idioma, chaves tipo
  `SIDEBAR.HOME`), só sem a biblioteca. Escopo desta rodada: navegação do sidebar e caixa de
  perfil/navbar, conforme o próprio pedido definiu como prioridade ("sidebar, formulários mais
  usados"). As demais ~46 telas com texto fixo em pt-BR (formulários, mensagens de notificação
  etc.) ainda não foram chaveadas — migração incremental, como também já estava previsto.

## 10. Área "Master" do sidebar vira "Configuração"

**Implementado.** Sidebar renomeado de "Master" pra "Configuração", com dois itens dentro:
"Módulos" (item 7) e o novo "Alertas".

**Controle de alertas:** nova entidade `AlertConfig` (Key/Name/Description/Enabled/
ThresholdDays), mesmo padrão do `FeatureToggle` — editável só por Master, em
`/alert-configs`. Mapeou os 3 alertas automáticos que já existiam hardcoded:

| Alerta | Antes | Agora |
|---|---|---|
| Manutenção de veículo vencida (bloqueia o veículo) | Sempre roda | `Enabled` liga/desliga o job |
| "Devoluções em Atraso" (dashboard) | Sempre roda | `Enabled` liga/desliga o job |
| Licença de motorista a vencer | `daysAhead=60` fixo no controller e no front (navbar) | `ThresholdDays` editável (60 por padrão); controller resolve o valor configurado quando o chamador não especifica `daysAhead` |

Todos os 3 falham "aberto" (comportamento atual preservado) se a config não existir ainda.
Sem alertas novos inventados — só os 3 que já existiam viraram configuráveis, como pedido.

---

**Status:** implementação concluída, 10/10 itens. Tabela completa de status entregue na conversa
pra você conferir.
