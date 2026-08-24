/**
 * Substitutes every {{Token}} occurrence in an admin-editable DocumentTemplate's Content with the
 * matching value from tokens. Two kinds of token exist by convention (not by syntax - the
 * substitution itself doesn't care): simple scalar tokens (e.g. {{ClientName}}) carry a single
 * value, while block tokens (e.g. {{ProductRows}}, {{SignatureBlock}}) carry a whole HTML
 * fragment still built in code from the record's data, keeping tables/totals/signatures safe from
 * a malformed upload - only the surrounding static text is actually admin-editable.
 */
export function renderDocumentTemplate(
  content: string,
  tokens: Record<string, string>,
): string {
  let result = content ?? '';
  for (const [key, value] of Object.entries(tokens)) {
    result = result.split(`{{${key}}}`).join(value ?? '');
  }
  return result;
}

/**
 * Splits a rendered multi-page template (e.g. Contrato) into individual page fragments on the
 * "<!-- PAGE_BREAK -->" marker used by DocumentTemplateSeeder. Single-page templates (Orçamento,
 * OS, Pedido de Venda) simply return a one-element array.
 */
export function splitTemplatePages(content: string): string[] {
  return content.split('<!-- PAGE_BREAK -->');
}
