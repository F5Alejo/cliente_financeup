import * as XLSX from 'xlsx';

export type FilaExportable = Record<string, string | number>;

export function exportarExcel(nombreArchivo: string, hoja: string, filas: FilaExportable[]): void {
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filas), hoja);
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
}

export function exportarCsv(nombreArchivo: string, filas: FilaExportable[]): void {
  // El BOM permite que Excel abra bien las tildes.
  const contenido = '﻿' + XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(filas));
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${nombreArchivo}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}
