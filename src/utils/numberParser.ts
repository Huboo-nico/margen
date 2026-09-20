/**
 * Utilidad robusta para parsear números provenientes de Google Sheets, entradas del usuario o JSON.
 *
 * Resuelve la discrepancia entre notación anglosajona (1,000 = mil) y europea (1.000 = mil):
 * - "1,000"  => 1000
 * - "1.000"  => 1000
 * - "1000"   => 1000
 * - "10,000" => 10000
 * - "10.000" => 10000
 * - "1,000.00" => 1000
 * - "1.000,00" => 1000
 * - "1.50"   => 1.5 (precio o ratio)
 * - "1,50"   => 1.5 (precio o ratio)
 */
export function parseSheetNumber(val: any, options?: { isInteger?: boolean } | boolean): number {
  if (val === null || val === undefined) return 0;
  const isInteger = typeof options === 'boolean' ? options : Boolean(options?.isInteger);

  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    return isInteger ? Math.round(val) : val;
  }

  let str = String(val).trim();
  if (!str) return 0;

  // Eliminar símbolos de moneda, comillas, porcentajes y espacios (incluyendo espacios de no separación \u00A0 y \u202F)
  str = str.replace(/[€$£%'"\s\u00A0\u202F]/g, '');
  if (!str) return 0;

  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');

  // Caso 1: Ambos separadores presentes ("1,000.50" o "1.000,50")
  if (lastDot !== -1 && lastComma !== -1) {
    if (lastDot > lastComma) {
      // Notación US: coma = miles, punto = decimal ("1,000.50" -> "1000.50")
      str = str.replace(/,/g, '');
    } else {
      // Notación EU: punto = miles, coma = decimal ("1.000,50" -> "1000.50")
      str = str.replace(/\./g, '').replace(',', '.');
    }
    const n = parseFloat(str);
    if (isNaN(n)) return 0;
    return isInteger ? Math.round(n) : n;
  }

  // Caso 2: Solo coma presente
  if (lastComma !== -1) {
    const parts = str.split(',');
    if (parts.length > 2) {
      // Múltiples comas ("1,000,000" -> separador de miles)
      str = str.replace(/,/g, '');
      const n = parseFloat(str);
      return isNaN(n) ? 0 : (isInteger ? Math.round(n) : n);
    }
    const dec = parts[1];
    if (isInteger) {
      // En conteos enteros (pedidos / mes, skuCount, etc.): "1,000" es 1000
      if (dec.length === 3) {
        str = str.replace(/,/g, '');
      } else if (dec === '0' || dec === '00') {
        str = parts[0];
      } else {
        str = str.replace(',', '.');
      }
    } else {
      // En números generales/precios:
      // Si tiene exactamente 3 dígitos tras la coma ("1,000" o "10,000"), es separador de miles
      if (dec.length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
        str = str.replace(/,/g, '');
      } else {
        // Decimal estándar ("1,50" -> "1.50")
        str = str.replace(',', '.');
      }
    }
  } else if (lastDot !== -1) {
    // Caso 3: Solo punto presente
    const parts = str.split('.');
    if (parts.length > 2) {
      // Múltiples puntos ("1.000.000" -> separador de miles)
      str = str.replace(/\./g, '');
      const n = parseFloat(str);
      return isNaN(n) ? 0 : (isInteger ? Math.round(n) : n);
    }
    const dec = parts[1];
    if (isInteger) {
      // En pedidos / mes o conteos: "1.000" es 1000, "10.000" es 10000
      if (dec.length === 3) {
        str = str.replace(/\./g, '');
      } else if (dec === '0' || dec === '00') {
        str = parts[0];
      }
    } else {
      // En números generales: si tiene exactamente 3 dígitos tras el punto ("1.000" o "10.000"), es separador de miles
      if (dec.length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
        str = str.replace(/\./g, '');
      }
    }
  }

  const result = parseFloat(str);
  if (isNaN(result)) return 0;
  return isInteger ? Math.round(result) : result;
}
