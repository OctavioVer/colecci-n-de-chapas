import * as ImagePicker from 'expo-image-picker';

export type PhotoSource = 'camera' | 'library';

export type PickResult = { uri: string } | { error: 'permission' } | null;

/**
 * En la versión web las fotos se guardan como data URI dentro del
 * almacenamiento del navegador. Sirve para probar la app; la versión online
 * las va a subir al servidor.
 */
export async function pickPhoto(_source: PhotoSource): Promise<PickResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  if (asset.base64) return { uri: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` };
  return { uri: asset.uri };
}

export function deletePhotos(_uris: string[]): void {}
