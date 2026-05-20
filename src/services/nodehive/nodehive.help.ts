// src/services/nodehive/nodehive.help.ts
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

export interface HelpPageData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  pageInternalId: number | null;
  title: string | null;
  body: string | null; // HTML procesado
}

// Mapeo: slug de URL → palabras clave para buscar el título del nodo en NodeHive
// Basado en la exploración del API, ajustaremos según los títulos reales encontrados
const SLUG_KEYWORDS: Record<string, string[]> = {
  faq:           ['faq', 'faqs', 'preguntas frecuentes', 'frequently asked'],
  envios:        ['envío', 'envios', 'shipping', 'entrega', 'delivery', 'politica de envios', 'shipping policy'],
  devoluciones:  ['devoluc', 'return', 'returns', 'devoluciones', 'politica de devoluciones', 'devolution policy'],
  terminos:      ['término', 'terminos', 'terms', 'condiciones', 'términos y condiciones', 'terms and conditions'],
  privacidad:    ['privacidad', 'privacy', 'aviso', 'politica de privacidad', 'privacy policy'],
};

export async function getHelpPageData(slug: string, lang?: Lang): Promise<HelpPageData | null> {
  const defaultLang = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  const effectiveLang = lang ?? defaultLang;
  const keywords = SLUG_KEYWORDS[slug];
  if (!keywords) return null;

  try {
    // Buscar el content_page que contiene el párrafo _component_footer_help
    const nodeParams = new DrupalJsonApiParams();
    nodeParams
      .addInclude(['field_component'])
      .addFields('node--content_page', ['id', 'title', 'drupal_internal__nid', 'field_component'])
      .addPageLimit(50);

    const nodeRaw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/node/content_page?${nodeParams.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
    );

    if (nodeRaw.status !== 200) return null;

    const pages = (dataFormatter.deserialize(nodeRaw.data) as any[]) ?? [];

    // Encontrar la página cuyo título coincide con las keywords del slug
    const page = pages.find((p: any) => {
      const t = (p.title ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return keywords.some(kw =>
        t.includes(kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
    });

    if (!page) {
      console.warn(`[Help] No content_page found for slug "${slug}" (lang: ${effectiveLang})`);
      return null;
    }

    // Obtener internal ID del nodo desde el raw (Jsona puede no flattearlo)
    const rawData = nodeRaw.data as any;
    const rawPage = rawData?.data?.find((p: any) => p.id === page.id);
    const pageInternalId = rawPage?.attributes?.drupal_internal__nid ?? null;

    // Encontrar el párrafo _component_footer_help dentro del nodo
    const components: any[] = Array.isArray(page.field_component) ? page.field_component : [];
    const helpParagraph = components.find((c: any) =>
      c?.type === 'paragraph--_component_footer_help'
    );

    if (!helpParagraph?.id) {
      console.warn(`[Help] No _component_footer_help found in page "${page.title}"`);
      return null;
    }

    // Fetch del párrafo con sus campos completos
    const paraRaw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/paragraph/_component_footer_help/${helpParagraph.id}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
    );

    if (paraRaw.status !== 200) return null;

    const rawParaItem = (paraRaw.data as any)?.data ?? null;
    const attrs = rawParaItem?.attributes ?? {};

    return {
      paragraphId: rawParaItem?.id ?? null,
      paragraphInternalId: attrs.drupal_internal__id ?? null,
      pageInternalId,
      title: attrs.field_title ?? null,
      body: attrs.field_body?.processed ?? attrs.field_body?.value ?? null,
    };
  } catch (err) {
    console.error(`[Help] Error getHelpPageData("${slug}"):`, err);
    return null;
  }
}