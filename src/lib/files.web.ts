import * as DocumentPicker from 'expo-document-picker';

import { isCsvFile, type SpreadsheetSource } from './excel/read';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function shareFile(bytes: Uint8Array, filename: string): Promise<void> {
  const blob = new Blob([bytes as BlobPart], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface PickedSpreadsheet {
  name: string;
  source: SpreadsheetSource;
}

export async function pickSpreadsheet(): Promise<PickedSpreadsheet | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '.xlsx,.csv,.txt,' + XLSX_MIME + ',text/csv',
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset?.file) return null;
  if (isCsvFile(asset.name, asset.mimeType)) {
    return { name: asset.name, source: { kind: 'csv', text: await asset.file.text() } };
  }
  return { name: asset.name, source: { kind: 'xlsx', bytes: new Uint8Array(await asset.file.arrayBuffer()) } };
}
