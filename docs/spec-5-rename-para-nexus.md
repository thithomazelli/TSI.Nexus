# Spec 5: Renomear o projeto de Friday para Nexus

## Contexto

O produto já foi rebatizado de "Friday" para "Nexus" na marca (logo/título já mostram
"NEXUS" na UI) mas o código, os nomes de arquivo/pasta e o repositório ainda carregam o
nome antigo em todo lugar: namespaces .NET (`TSI.Nexus.*`), pastas de projeto, o `.sln`,
o path alias do frontend (`@nexus/core`), os workflows do GitHub Actions, o `web.config`,
e a documentação (README/CLAUDE.md).

Decisões já validadas com o usuário:
- **Escopo**: renomeação completa (namespaces, pastas/projetos, alias, CI/CD, docs) — não
  só cosmético.
- **Prefixo `TSI.`**: mantido. `TSI.Nexus.WebAPI` vira `TSI.Nexus.WebAPI` (não vira só
  `Nexus.WebAPI`).
- **Nome do repositório no GitHub**: já foi renomeado pelo usuário, de
  `thithomazelli/TSI.Nexus` pra `thithomazelli/TSI.Nexus` (confirmado via API - eu não
  tenho ferramenta pra fazer esse rename sozinho, só editar arquivo/PR). O remote local
  precisou ser atualizado (`git remote set-url origin
  https://github.com/thithomazelli/TSI.Nexus`) - o push por `git` direto parou de
  autenticar depois do rename (o escopo de credencial desta sessão ficou preso ao nome
  antigo), contornado usando as ferramentas de API do GitHub (MCP) pra esse commit.
- **Branch**: a renomeação começa na `main` (base genérica), não na `serodioturismo`.
  Motivo: uma renomeação de ~360 arquivos feita só na branch de sessão faria toda
  sincronização futura entre `main`/`serodioturismo` conflitar em praticamente todo
  arquivo pra sempre. Fazendo na `main` primeiro, o merge/rebase pra `serodioturismo`
  (e pra `serodio-main-pack`, que também diverge da `main`) fica tratável.
- **`web.config` de produção nos servidores** (`web.config.Production.xml` /
  `web.config.Production.Serodio.xml` — gitignored por design, vivem só nos servidores):
  o `processPath`/`arguments` desses arquivos referencia o nome do executável gerado
  (`TSI.Nexus.WebAPI.exe`/`.dll`), que muda com a renomeação. Ficam fora do meu alcance
  (não estão no git) — usuário confirmou que atualiza manualmente depois do deploy.

**Fora de escopo** (não foi pedido, e mudar teria risco/operação bem maiores que o resto):
- Nome do banco de dados (`Database=tsi_nexus` nas connection strings/appsettings) —
  mudar o nome de um banco em produção é uma operação de infra separada, não uma
  renomeação de código.

## Inventário do que muda

**Backend (.NET)** — 6 camadas + WebAPI, cada uma com `src/` e `tests/`:

| Atual | Novo |
|---|---|
| `TSI.Nexus.sln` | `TSI.Nexus.sln` |
| `TSI.Nexus.Contracts/` (+ `.csproj`, `.Tests.csproj`) | `TSI.Nexus.Contracts/` |
| `TSI.Nexus.Data/` | `TSI.Nexus.Data/` |
| `TSI.Nexus.IoC/` | `TSI.Nexus.IoC/` |
| `TSI.Nexus.Repository/` | `TSI.Nexus.Repository/` |
| `TSI.Nexus.Services/` | `TSI.Nexus.Services/` |
| `TSI.Nexus.WebAPI/` | `TSI.Nexus.WebAPI/` |

- `namespace TSI.Nexus...` → `namespace TSI.Nexus...` em **316 arquivos `.cs`**.
- `<RootNamespace>`/`<AssemblyName>` implícitos (herdados do nome do `.csproj`) mudam
  junto quando os `.csproj` são renomeados.
- `ProjectReference` dentro de cada `.csproj` e as entradas do `.sln` apontam pros
  caminhos/nomes antigos — precisam ser reescritos.
- `web.config` (o committado, não os `.Production.*.xml`): `processPath`/`arguments`
  referenciam `TSI.Nexus.WebAPI.exe`.

**Frontend (Angular)**:
- Pasta `TSI.Nexus.UIApp/` → `TSI.Nexus.UIApp/`.
- `package.json`/`package-lock.json`: `"name": "tsi.nexus.uiapp"` → `"tsi.nexus.uiapp"`.
- `angular.json`: chave do projeto (`"TSI.Nexus.UIApp"`) e `outputPath`
  (`dist/tsi.nexus.uiapp`) → `dist/tsi.nexus.uiapp`.
- `tsconfig.json`: alias `"@nexus/core": ["./src/app/core"]` → `"@nexus/core"`.
- **146 arquivos `.ts`** importando de `@nexus/core` → `@nexus/core`.

**CI/CD** (`.github/workflows/deploy.yml`): todos os caminhos `TSI.Nexus.WebAPI/...`,
`TSI.Nexus.UIApp/...`, `dist/tsi.nexus.uiapp/...` nos 4 jobs (deploy-frontend,
deploy-backend, deploy-frontend-serodio, deploy-backend-serodio).

**Documentação**: `README.md` (9 menções) e `CLAUDE.md` (10 menções) — nomes de pasta,
comandos (`dotnet build TSI.Nexus.sln`, `cd TSI.Nexus.WebAPI/...`), texto descritivo.

## Ordem de execução

1. Checkout local de `main` (atualizada com `origin/main`), working tree limpo.
2. `git mv` de cada pasta/arquivo (preserva histórico) — projetos backend primeiro, depois
   `TSI.Nexus.UIApp/`.
3. Find/replace em massa (`namespace TSI.Nexus` → `namespace TSI.Nexus`, `TSI.Nexus.` →
   `TSI.Nexus.` em `.csproj`/`.sln`/`web.config`, `@nexus/core` → `@nexus/core` nos 146
   arquivos, `tsi.nexus.uiapp` → `tsi.nexus.uiapp` em `package.json`/`angular.json`).
4. Atualizar `.github/workflows/deploy.yml`, `README.md`, `CLAUDE.md`.
5. `dotnet build TSI.Nexus.sln` — 0 erros.
6. `dotnet test` — suíte completa passando (376 testes atualmente).
7. `npm install` (nome do pacote mudou) + `ng build --configuration development` e
   `--configuration production` — 0 erros.
8. Smoke test ao vivo (Playwright): login + navegação básica, confirmar que nada quebrou
   na prática, não só no build.
9. Commit único (ou poucos commits lógicos) na `main`, push.
10. Reportar pro usuário: pronto pra ele atualizar os `web.config` de produção nos
    servidores; e pra decidir quando/como propagar isso pra `serodioturismo` e
    `serodio-main-pack` (fora do escopo desta spec — cada merge desses é grande o
    suficiente pra ser tratado à parte).

## Verificação
- `dotnet build TSI.Nexus.sln` limpo.
- `dotnet test` 100% passando.
- `ng build` (dev + prod) limpo.
- Smoke test manual/Playwright: app sobe, login funciona, navegação básica funciona.
