/**
 * Generates a professional invoice code based on company prefix, date, and unique ID suffix.
 * Format: [PREFIX]/[YYMMDD]/[UNIQUE]
 * Example: BEF/240511/45D2
 */
export const generateInvoiceCode = (id: string | undefined, date: string | Date | undefined, prefix: 'BEF' | 'MBF'): string => {
  if (!id) return `${prefix}/000000/0000`;
  
  const dateObj = date ? new Date(date) : new Date();
  
  // Format YYMMDD
  const yy = dateObj.getFullYear().toString().slice(-2);
  const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const dd = dateObj.getDate().toString().padStart(2, '0');
  
  // Get unique suffix (last 4 chars of ID)
  const unique = id.slice(-4).toUpperCase();
  
  return `${prefix}/${yy}${mm}${dd}/${unique}`;
};
