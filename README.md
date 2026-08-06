# TSI.Friday

Sistema de gestão comercial (ERP enxuto) desenvolvido para uma empresa de locação/venda de produtos (caçambas e serviços de descarte/reciclagem). Cobre o fluxo completo de **orçamento → pedido → transação → pagamento**, além de cadastro de clientes/fornecedores, catálogo de produtos, controle de inadimplência e relatórios.

## Stack

**Backend** — .NET 8 / ASP.NET Core Web API, Entity Framework Core (MySQL), ASP.NET Identity + JWT, AutoMapper.

**Frontend** — Angular 21, RxJS para estado, Bootstrap + PrimeNG + Angular Material + AdminLTE, ag-Grid, ApexCharts.

## Arquitetura

O backend é organizado em camadas, cada uma como um projeto .NET separado:

```
WebAPI  → IoC → Services → Repository → Data → Contracts
```

- **Contracts** — modelos, DTOs, enums e interfaces (camada pura, sem dependências).
- **Data** — `DbContext` (EF Core), interceptors (auditoria, ajuste automático de estoque), migrations e seed de dados.
- **Repository** — repositório genérico (`Repository<T>`) sobre o `DbContext`.
- **Services** — regras de negócio, um serviço por domínio (produtos, pedidos, orçamentos, pagamentos, usuários, etc.).
- **IoC** — configuração de injeção de dependência e AutoMapper.
- **WebAPI** — 18 controllers REST, autenticação JWT, Swagger (dev).

O frontend (`TSI.Friday.UIApp`) é um app Angular modular, com um módulo lazy-loaded por feature (contas, parceiros de negócio, pedidos, orçamentos, pagamentos, produtos, transações, usuários, relatórios) e uma camada `core/` com guards, interceptors, serviços de API e modelos compartilhados.

## Funcionalidades principais

- Cadastro de parceiros de negócio (pessoa física ou jurídica), com endereços e anexos
- Catálogo de produtos (venda/locação) com fotos
- Orçamentos (quotes) convertíveis em pedidos
- Pedidos, transações e pagamentos, com cálculo de descontos/totais
- Job automático de identificação de itens/pagamentos em atraso
- Dashboard com indicadores e relatórios
- Autenticação com JWT, papéis de usuário (Admin/User), confirmação de e-mail e reset de senha por e-mail (Mailjet)

## Rodando o projeto

**Backend:**
```bash
cd TSI.Friday.WebAPI/src/TSI.Friday.WebAPI
dotnet restore
dotnet ef database update   # aplica as migrations no MySQL configurado
dotnet run
```

**Frontend:**
```bash
cd TSI.Friday.UIApp
npm install
npm start
```

> `appsettings.json` / `appsettings.Development.json` não contêm mais credenciais reais — os valores devem ser fornecidos via variáveis de ambiente (o ASP.NET Core sobrescreve a configuração automaticamente) ou via `dotnet user-secrets` em desenvolvimento local:
>
> | Variável | Corresponde a |
> |---|---|
> | `ConnectionStrings__DefaultConnection` | Connection string do MySQL de produção |
> | `ConnectionStrings__HomologConnection` | Connection string do MySQL de homologação |
> | `JWT__Key` | Chave de assinatura dos tokens JWT |
> | `MailJet__ApiKey` | API Key do Mailjet |
> | `MailJet__SecretKey` | Secret Key do Mailjet |

## Testes

```bash
dotnet test          # backend (xUnit/Moq/FluentAssertions)
cd TSI.Friday.UIApp && npm test   # frontend (Karma/Jasmine)
```

## Status e débito técnico conhecido

Projeto ativo, migrado do Bitbucket para o GitHub preservando todo o histórico de commits. Pontos conhecidos a endereçar:

- **Segurança**: credenciais antigas (banco, JWT, Mailjet) foram removidas dos arquivos e do histórico de commits — mas por terem sido expostas em algum momento, precisam ser **rotacionadas** (senha do MySQL, chave JWT, chaves do Mailjet) caso ainda não tenha sido feito.
- **Cobertura de testes**: sólida no backend para os módulos mais antigos, mas ausente no módulo de Orçamentos (o mais recente) e nos serviços de autenticação/anexos. No frontend, os specs existentes são boilerplate do Angular CLI, sem cobertura real.
- **Serviço em segundo plano duplicado**: há implementações duplicadas de `OverdueStatusBackgroundService` registradas simultaneamente, rodando a verificação de atraso em agendas diferentes e sobrepostas.
- **Stack de UI**: Bootstrap, PrimeNG, Angular Material e AdminLTE convivem no mesmo frontend — candidato a consolidação.
- **CI/CD**: não há pipeline automatizado (build, testes ou deploy) configurado no repositório.
