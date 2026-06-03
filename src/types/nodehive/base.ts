/**
 * Tipos base de medios y archivos de NodeHive.
 * Estos son los "building blocks" para todo lo demás.
 */

/**
 * Nodo de tipo Category (del bloque categorys_home)
 */
export interface CategoryNode {
  type: 'node--category';
  id: string;
  title?: string;
  field_name?: string;
  field_photo?: NodeHiveMedia;
}

/**
 * Archivo después de que Jsona aplana los attributes.
 * uri.url es relativa al base URL (ej: /sites/default/files/foto.jpg)
 */
export interface NodeHiveFile {
  type: 'file--file';
  id: string;
  filename: string;
  uri: {
    value: string;
    url: string;
  };
  filemime: string;
}

/**
 * Media de tipo Image después de que Jsona aplana los attributes.
 */
export interface NodeHiveMedia {
  type: 'media--image';
  id: string;
  name: string;
  field_media_image?: {
    type: 'file--file';
    id: string;
    filename: string;
    uri: {
      value: string;
      url: string;
    };
    filemime: string;
  };
}

/**
 * Devuelve null si file es undefined para no romper en includes parciales.
 */
export function nodehiveFileUrl(file: NodeHiveFile | undefined, baseUrl: string): string | null {
  if (!file?.uri?.url) return null;
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  return `${normalizedBase}${file.uri.url}`;
}

/**
 * Devuelve null si media es undefined o no tiene field_media_image.
 */
export function nodehiveMediaUrl(media: NodeHiveMedia | undefined, baseUrl: string): string | null {
  if (!media?.field_media_image) return null;
  return nodehiveFileUrl(media.field_media_image, baseUrl);
}