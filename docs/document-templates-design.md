# Templates de documentos editáveis — desenho consolidado

> Complementa `feature-toggle-design.md`. Cobre a geração de PDF (Orçamento, Contrato, OS, e o
> novo Pedido de Venda) deixando de ser texto fixo em código pra virar conteúdo editável pelo
> cliente.

## 1. Situação atual

Hoje `serodioturismo` já emite três documentos, todos com o texto **fixo dentro do TypeScript**
(`orders/utilities/order-documents.ts`, `quotes/utilities/quote-documents.ts`,
`core/utilities/letterhead-pdf.ts`):

- **Orçamento** (PDF do `Quote`) — `buildQuotePages`.
- **Contrato** (PDF do `Order`/futura `Trip`) — `buildContractPages`.
- **Ordem de Serviço** — `buildServiceOrderPages` (hoje montado dentro de `order-documents.ts`
  na `main-pack`; na `serodioturismo` a OS de motorista já existe como conceito próprio).

Pra mudar qualquer coisa nesses documentos hoje — logo, um texto de cláusula, o endereço do
rodapé — precisa editar código e fazer deploy. Isso não escala pra múltiplos clientes.

## 2. Objetivo

1. Cada cliente deve poder **baixar** o template atual de cada documento, **editar** localmente
   (logotipo, textos pontuais, endereço de rodapé etc.) e **subir** a versão atualizada, sem
   precisar de deploy.
2. Adicionar um documento que a Serodio não usa hoje: **Pedido de Venda** (resumo do pedido,
   lista de produtos, forma de pagamento) — template novo, básico, criado do zero.
3. Por enquanto os templates continuam com o conteúdo real da Serodio (contrato de fretamento,
   orçamento, OS) — só a **capacidade de gerenciar** é liberada agora; a Serodio não precisa
   trocar nada pra continuar funcionando como está.

## 3. Por que não guardar o HTML inteiro editável

Guardar o HTML inteiro (incluindo a tabela de produtos, cálculos, formatação de moeda) como
"editável" pelo cliente é frágil — um upload mal formatado quebra a geração pra sempre, e o
cliente teria que reconstruir lógica (loop de itens, formatação de data/moeda) que hoje é código
testado.

**Abordagem**: o template guarda a parte estática (cabeçalho, texto de cláusulas, rodapé,
posicionamento do logotipo) com **placeholders** (`{{clientName}}`, `{{totalPrice}}` etc.); a
parte dinâmica que já é lógica de negócio hoje (linhas da tabela de produtos, bloco de
assinatura) continua sendo montada em código e injetada num placeholder de bloco
(`{{PRODUCT_ROWS}}`, `{{SIGNATURE_BLOCK}}`). O cliente edita texto/estilo/posicionamento; a
lógica de cálculo/formatação continua protegida em código.

Isso é uma extensão pequena do que já existe — as funções `buildQuotePages`/`buildContractPages`
etc. continuam existindo e montando os blocos dinâmicos exatamente como hoje; só passam a buscar
o "esqueleto" HTML de um template em vez de ter o HTML inteiro fixo na função.

## 4. Entidade `DocumentTemplate`

```csharp
using System;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class DocumentTemplate : BaseModel
    {
        public DocumentTemplateType Type { get; set; }

        public string Name { get; set; } = string.Empty;

        public string FileName { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public DocumentTemplate() { }
    }
}
```

```csharp
namespace TSI.Friday.Contracts.Enums
{
    public enum DocumentTemplateType
    {
        Quote,
        Contract,
        ServiceOrder,
        SalesOrder,
    }
}
```

- Um registro por tipo (`Type` com índice único) — não é uma lista de arquivos soltos, é "o
  template atual de cada documento".
- `Content` guarda o HTML direto na coluna (mesmo padrão de simplicidade de outros campos texto
  do projeto) — não precisa do mecanismo de arquivo em disco que `Attachment` usa, porque não é
  um anexo de usuário vinculado a um registro de negócio, é configuração do sistema.
- `FileName` é só o nome sugerido no download (ex.: `orcamento.html`), não implica arquivo físico.

## 5. Backend — serviço e controller (mesmo padrão do resto do projeto)

`IDocumentTemplateService` com `Add`/`Update`/`Remove`/`FindById`/`FindAll`/`FindByType`, mesma
assinatura e XML doc de `ITripLegService`. `DocumentTemplatesController` com as mesmas rotas
(`Add`/`Update`/`Remove`/`GetById/{id}`/`GetByType/{type}`), mais duas rotas específicas:

```
GET  api/DocumentTemplates/Download/{type}   -> retorna o Content como text/html, Content-Disposition attachment
POST api/DocumentTemplates/Upload/{type}     -> recebe um arquivo .html, substitui o Content
```

Acesso: só **Admin** (não é Master — isso é configuração de negócio/branding, diferente do painel
de liga/desliga módulo que é exclusivo do Master, conforme `feature-toggle-design.md` seção 2).

## 6. Seed inicial

`DatabaseSeeder` passa a garantir um `DocumentTemplate` por tipo, se não existir:

- `Quote`, `Contract` — conteúdo migrado do que já está hoje em `buildContractPages`/
  `buildQuotePages` (a parte estática: título, cláusulas, texto de condições gerais), com os
  placeholders no lugar dos `${...}` que hoje são interpolados direto no TypeScript.
- `ServiceOrder` — idem, com o texto que já existe pra OS.
- `SalesOrder` — **novo**, não existe hoje. Básico: cabeçalho com dados do cliente, tabela de
  itens, total, condição de pagamento, bloco de assinatura. Serve de base pro `buildSalesOrderPages`
  que a `main-pack` já usa (mesmo formato, só migrando pra template editável).

## 7. Frontend

- Tela nova em **Administração → Templates de Documentos** (visível só pra Admin): lista os 4
  tipos, cada linha com nome, última atualização, botão "Baixar" e botão "Atualizar" (abre o
  seletor de arquivo `.html`).
- `buildQuotePages`/`buildContractPages`/`buildServiceOrderPages`/`buildSalesOrderPages` passam a
  buscar o template via `DocumentTemplateService.getByType(type)` e fazer o replace dos
  placeholders escalares (`{{clientName}}`, `{{totalPrice}}` etc.) + injetar os blocos dinâmicos
  (`{{PRODUCT_ROWS}}`, `{{SIGNATURE_BLOCK}}`) que continuam montados em código exatamente como
  hoje.
- Mantém os botões/estilos já padronizados (`.btn-outline-primary`, `.btn-sm`,
  `.modal-scrollable-area` se for modal, `[appClick]` no submit de upload).

## 8. Fora de escopo por enquanto

- Editor de template dentro do próprio sistema (WYSIWYG) — por enquanto é baixar/editar
  localmente/subir, sem editor embutido.
- Múltiplas versões/histórico de template — só a versão atual é guardada; trocar sobrescreve.
- Preview do template antes de salvar o upload — pode entrar depois se for pedido.
