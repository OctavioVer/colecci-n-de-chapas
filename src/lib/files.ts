import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { isCsvFile, type SpreadsheetSource } from './excel/read';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const SPREADSHEET_TYPES = [
  XLSX_MIME,
  'application/vnd.ms-excel',
  'text/csv',
  'text/comma-separated-values',
  'text/plain',
];

/** Guarda el archivo y abre el menú de compartir (WhatsApp, mail, Drive, etc.). */
export async function shareFile(bytes: Uint8Array, filename: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(bytes);
  await Sharing.shareAsync(file.uri, {
    mimeType: XLSX_MIME,
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
    dialogTitle: filename,
  });
}

export interface PickedSpreadsheet {
  name: string;
  source: SpreadsheetSource;
}

export async function pickSpreadsheet(): Promise<PickedSpreadsheet | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: SPREADSHEET_TYPES, copyToCacheDirectory: true });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  const file = new File(asset.uri);
  if (isCsvFile(asset.name, asset.mimeType)) return { name: asset.name, source: { kind: 'csv', text: await file.text() } };
  return { name: asset.name, source: { kind: 'xlsx', bytes: await file.bytes() } };
}
