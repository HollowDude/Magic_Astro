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
 * Convierte la URL relativa de un archivo de NodeHive en absoluta.
 *
 * @param file    Objeto NodeHiveFile deserializado por Jsona
 * @param baseUrl Base URL de NodeHive SIN trailing slash
 */
export function nodehiveFileUrl(file: NodeHiveFile, baseUrl: string): string {
  return `${baseUrl}${file.uri.url}`;
}

/**
 * Convierte la URL relativa de un media de NodeHive en absoluta.
 */
export function nodehiveMediaUrl(media: NodeHiveMedia, baseUrl: string): string | null {
  if (!media.field_media_image) return null;
  return nodehiveFileUrl(media.field_media_image, baseUrl);
}