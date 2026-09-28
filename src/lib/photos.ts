import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { createId } from '@/domain/id';

export type PhotoSource = 'camera' | 'library';

export type PickResult = { uri: string } | { error: 'permission' } | null;

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/** Abre la cámara o la galería y guarda la foto dentro de la app. */
export async function pickPhoto(source: PhotoSource): Promise<PickResult> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { error: 'permission' };
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets[0]) return null;

  const picked = new File(result.assets[0].uri);
  const target = new File(photosDir(), `${createId()}.jpg`);
  picked.copySync(target);
  return { uri: target.uri };
}

export function deletePhotos(uris: string[]): void {
  for (const uri of uris) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Si la foto ya no existe no hay nada que borrar.
    }
  }
}
