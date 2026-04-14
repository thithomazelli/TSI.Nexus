/**
 * Formata um CPF sem pontuação para o formato XXX.XXX.XXX-XX
 * @param cpf - CPF com ou sem formatação
 * @returns CPF formatado ou string vazia se inválido
 */
export function formatCPF(cpf: string | undefined | null): string {
  if (!cpf) return '';

  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return cleanCPF;

  // Formata: XXX.XXX.XXX-XX
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um CNPJ sem pontuação para o formato XX.XXX.XXX/XXXX-XX
 * @param cnpj - CNPJ com ou sem formatação
 * @returns CNPJ formatado ou string vazia se inválido
 */
export function formatCNPJ(cnpj: string | undefined | null): string {
  if (!cnpj) return '';

  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return cleanCNPJ;

  // Formata: XX.XXX.XXX/XXXX-XX
  return cleanCNPJ.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5',
  );
}

/**
 * Formata um documento (CPF ou CNPJ) baseado no comprimento
 * @param document - Documento com ou sem formatação
 * @returns Documento formatado
 */
export function formatDocument(document: string | undefined | null): string {
  if (!document) return '';

  const cleanDoc = document.replace(/\D/g, '');

  if (cleanDoc.length === 11) {
    return formatCPF(cleanDoc);
  } else if (cleanDoc.length === 14) {
    return formatCNPJ(cleanDoc);
  }

  return document;
}
