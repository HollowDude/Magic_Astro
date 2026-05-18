// src/services/nodehive/nodehive.courses.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveMediaUrl } from '@/types/nodehive';
import type { Lang } from '@/i18n/ui';
import type {
  CoursesPageData,
  CoursesHeroData,
  CoursesHeroSlide,
  CoursesStatsData,
  CoursesGridData,
  CourseItem,
  CourseFormat,
  CourseLevel,
} from '@/types/nodehive/content';

const dataFormatter = new Jsona();
const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

const FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  },
} as const;

// Hints to identify paragraphs
const COURSES_HERO_HINTS = [
  'courses_hero',
  'academy_hero',
  'cursos_hero',
  'academia_hero',
  'courses_slider',
  'courses_banner',
];
const COURSES_STATS_HINTS = [
  'courses_stats',
  'academy_stats',
  'academy_statistics',
  'cursos_stats',
  'academia_stats',
  'courses_numbers',
  'statistics',
];
const COURSES_GRID_HINTS = [
  'academy_courses',
  'courses_grid',
  'academy_grid',
  'cursos_grid',
  'academia_grid',
  'courses_list',
  'courses_catalog',
];

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function matchesHints(type: string, hints: string[]): boolean {
  const token = normalizeToken(type);
  return hints.some((hint) => token.includes(normalizeToken(hint)));
}

function isCoursesComponent(type: string): boolean {
  const token = normalizeToken(type);
  return token.includes('course') || token.includes('curso') || token.includes('academy') || token.includes('academia');
}

function getParagraphBundle(type: string): string {
  return type.startsWith('paragraph--') ? type.slice('paragraph--'.length) : type;
}

function extractText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const obj = value as { processed?: unknown; value?: unknown };
    if (typeof obj.processed === 'string') return obj.processed.trim() || null;
    if (typeof obj.value === 'string') return obj.value.trim() || null;
  }
  return null;
}

function extractNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extractLabel(value: unknown): string | null {
  if (Array.isArray(value)) return extractLabel(value[0]);
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return extractText(
      obj.name ?? obj.title ?? obj.label ?? obj.field_name ?? obj.field_title ?? obj.value ?? obj.processed ?? null,
    );
  }
  return null;
}

function pickTextField(attrs: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    if (key in attrs) {
      const val = extractText(attrs[key]);
      if (val) return val;
    }
  }
  return null;
}

function normalizeLink(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('internal:')) return raw.replace(/^internal:/, '');
  if (raw.startsWith('entity:node/')) return raw.replace(/^entity:node\//, '/node/');
  return raw;
}

function formatDuration(value: unknown): string | null {
  const text = extractText(value);
  if (!text) return null;
  if (/^\d+$/.test(text)) return `${text} semanas`;
  return text;
}

async function fetchWithLangFallback<T>(path: string, lang: string, fallbackLang: string) {
  const primary = await nodehiveFetch<T>(path, { ...FETCH_OPTIONS, lang });
  if (primary.status === 404 && lang !== fallbackLang) {
    const fallback = await nodehiveFetch<T>(path, { ...FETCH_OPTIONS, lang: fallbackLang });
    return fallback.status === 200 ? fallback : primary;
  }
  return primary;
}

function normalizeCourse(raw: any, bundle: string): CourseItem {
  const mediaRef = raw.field_head_photo ?? raw.field_image ?? raw.field_photo ?? null;
  const imageUrl = mediaRef ? nodehiveMediaUrl(mediaRef, NODEHIVE_BASE_URL) : null;

  const priceRaw = extractText(raw.field_price ?? raw.field_precio ?? raw.field_course_price ?? null);
  const isFree = priceRaw ? (priceRaw === '0' || /free|gratis/i.test(priceRaw)) : false;

  const modalityRaw = extractLabel(raw.field_modality ?? null) ?? '';
  const formatRaw = extractText(raw.field_format ?? raw.field_formato ?? raw.field_type ?? null) ?? modalityRaw;
  const formatMap: Record<string, CourseFormat> = {
    presencial: 'in-person',
    'in-person': 'in-person',
    inperson: 'in-person',
    digital: 'digital',
    online: 'digital',
    taller: 'workshop',
    workshop: 'workshop',
  };
  const format: CourseFormat = formatMap[normalizeToken(formatRaw)] ?? 'digital';

  const levelRaw = extractText(raw.field_level ?? raw.field_nivel ?? null);
  const levelMap: Record<string, CourseLevel> = {
    principiante: 'beginner',
    beginner: 'beginner',
    intermedio: 'intermediate',
    intermediate: 'intermediate',
    avanzado: 'advanced',
    advanced: 'advanced',
  };
  const level: CourseLevel | null = levelRaw
    ? (levelMap[normalizeToken(levelRaw)] ?? 'all')
    : null;

  return {
    id: raw.id ?? '',
    internalId: raw.drupal_internal__id ?? null,
    title: extractText(raw.field_title ?? raw.title) ?? '',
    description: extractText(raw.field_description ?? raw.field_descripcion ?? raw.body) ?? null,
    imageUrl,
    price: isFree ? null : priceRaw,
    isFree,
    format,
    level,
    date: extractText(raw.field_date ?? raw.field_fecha ?? raw.field_schedule ?? null),
    duration: formatDuration(raw.field_duration ?? raw.field_duracion ?? null),
    rating: raw.field_rating ? Number(raw.field_rating) : null,
    reviewCount: extractNumber(raw.field_review_count ?? raw.field_reviews ?? null),
    spotsLeft: extractNumber(raw.field_spots_left ?? raw.field_cupos ?? null),
    ctaUrl: normalizeLink(
      extractText(raw.field_course_page?.uri ?? raw.field_cta_url ?? raw.field_link?.uri ?? null),
    ),
    bundle,
  };
}

// Main function
export async function getCoursesPageData(lang?: Lang): Promise<CoursesPageData | null> {
  const defaultLang = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  const effectiveLang = lang ?? defaultLang;

  try {
    // Step A: find courses page
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_component'])
      .addFields('node--content_page', ['id', 'title', 'field_component', 'drupal_internal__nid'])
      .addPageLimit(30);

    const nodeRaw = await fetchWithLangFallback<Record<string, unknown>>(
      `/jsonapi/node/content_page?${params.getQueryString()}`,
      effectiveLang,
      defaultLang,
    );

    if (nodeRaw.status !== 200) {
      console.error(`[Courses] HTTP ${nodeRaw.status} fetching content_page`);
      return null;
    }

    const pages = (dataFormatter.deserialize(nodeRaw.data) as any[]) ?? [];

    const page = pages.find((p: any) => {
      const title = typeof p?.title === 'string' ? p.title.toLowerCase() : '';
      return (
        title.includes('course') ||
        title.includes('curso') ||
        title.includes('academy') ||
        title.includes('academia') ||
        title.includes('cursos')
      );
    });

    if (!page) {
      console.warn('[Courses] No courses/academy content_page found in NodeHive');
      return null;
    }

    let pageInternalId = page.drupal_internal__nid ?? null;
    if (pageInternalId == null) {
      const rawPage = (nodeRaw.data as any)?.data?.find((p: any) => p.id === page.id);
      pageInternalId = rawPage?.attributes?.drupal_internal__nid ?? null;
    }

    const components: any[] = Array.isArray(page.field_component) ? page.field_component : [];
    const courseComponents = components.filter((c: any) => typeof c?.type === 'string' && isCoursesComponent(c.type));

    const heroComp = courseComponents.find((c: any) => matchesHints(c.type, COURSES_HERO_HINTS)) ?? null;
    const statsComp = courseComponents.find((c: any) => matchesHints(c.type, COURSES_STATS_HINTS)) ?? null;
    const gridComp = courseComponents.find((c: any) => matchesHints(c.type, COURSES_GRID_HINTS)) ?? null;

    // Step B: fetch paragraphs in parallel
    const [hero, stats, grid] = await Promise.all([
      heroComp ? fetchCoursesHero(heroComp, effectiveLang, defaultLang) : Promise.resolve(null),
      statsComp ? fetchCoursesStats(statsComp, effectiveLang, defaultLang) : Promise.resolve(null),
      gridComp ? fetchCoursesGrid(gridComp, effectiveLang, defaultLang) : Promise.resolve(null),
    ]);

    return { pageId: page.id, pageInternalId, hero, stats, grid };
  } catch (err) {
    console.error('[Courses] Error getCoursesPageData:', err);
    return null;
  }
}

// Hero
async function fetchCoursesHero(comp: any, lang: string, fallback: string): Promise<CoursesHeroData | null> {
  try {
    const bundle = getParagraphBundle(comp.type);
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_photos_slider', 'field_photos_slider.field_media_image', 'field_buttons'])
      .addFields(`paragraph--${bundle}`, [
        'id',
        'drupal_internal__id',
        'parent_id',
        'field_title',
        'field_description',
        'field_photos_slider',
        'field_buttons',
      ])
      .addFields('paragraph--button', ['field_button_text', 'field_button_link', 'field_button_style'])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri']);

    const raw = await fetchWithLangFallback<Record<string, unknown>>(
      `/jsonapi/paragraph/${bundle}/${comp.id}?${params.getQueryString()}`,
      lang,
      fallback,
    );

    if (raw.status !== 200) return null;

    const heroData = dataFormatter.deserialize(raw.data) as any;
    const attrs = (raw.data as any)?.data?.attributes ?? {};

    const photos = Array.isArray(heroData?.field_photos_slider)
      ? heroData.field_photos_slider
      : (heroData?.field_photos_slider ? [heroData.field_photos_slider] : []);

    const buttons = Array.isArray(heroData?.field_buttons)
      ? heroData.field_buttons
      : (heroData?.field_buttons ? [heroData.field_buttons] : []);

    const primaryBtn = buttons[0];
    const secondaryBtn = buttons[1];
    const ctaUrl = normalizeLink(extractText(primaryBtn?.field_button_link?.uri ?? null));
    const ctaText = extractText(primaryBtn?.field_button_text) ?? null;
    const ctaStyle = extractText(primaryBtn?.field_button_style) ?? null;
    const ctaSecondaryUrl = normalizeLink(extractText(secondaryBtn?.field_button_link?.uri ?? null));
    const ctaSecondaryText = extractText(secondaryBtn?.field_button_text) ?? null;
    const ctaSecondaryStyle = extractText(secondaryBtn?.field_button_style) ?? null;
    const title = extractText(heroData?.field_title ?? attrs.field_title) ?? '';
    const description = extractText(heroData?.field_description ?? attrs.field_description) ?? null;

    const slides: CoursesHeroSlide[] = photos.map((media: any) => ({
      image: nodehiveMediaUrl(media, NODEHIVE_BASE_URL) ?? '',
      label: media?.name ?? title,
      badgeText: null,
      badgeColor: null,
      title,
      description,
      ctaUrl,
      ctaText,
      ctaStyle,
      ctaSecondaryUrl,
      ctaSecondaryText,
      ctaSecondaryStyle,
    })).filter((slide) => slide.image || slide.title || slide.description);

    return {
      paragraphId: heroData?.id ?? null,
      paragraphInternalId: attrs.drupal_internal__id ?? null,
      parentId: attrs.parent_id ?? null,
      bundle,
      slides,
    };
  } catch (err) {
    console.error('[Courses] Error fetchCoursesHero:', err);
    return null;
  }
}

// Stats
async function fetchCoursesStats(comp: any, lang: string, fallback: string): Promise<CoursesStatsData | null> {
  try {
    const bundle = getParagraphBundle(comp.type);
    const raw = await fetchWithLangFallback<Record<string, unknown>>(
      `/jsonapi/paragraph/${bundle}/${comp.id}`,
      lang,
      fallback,
    );

    if (raw.status !== 200) return null;

    const attrs = (raw.data as any)?.data?.attributes ?? {};

    const studentsPrefix = pickTextField(attrs, [
      'field_estudiants_prefix',
      'field_estudiants_stadistic_prefix',
      'field_students_prefix',
      'field_students_stadistic_prefix',
    ]);
    const studentsSuffix = pickTextField(attrs, [
      'field_estudiants_suffix',
      'field_estudiants_stadistic_suffix',
      'field_students_suffix',
      'field_students_stadistic_suffix',
    ]);
    const coursesPrefix = pickTextField(attrs, [
      'field_courses_prefix',
      'field_courses_stadistic_prefix',
    ]);
    const coursesSuffix = pickTextField(attrs, [
      'field_courses_suffix',
      'field_courses_stadistic_suffix',
    ]);
    const ratingPrefix = pickTextField(attrs, [
      'field_rating_prefix',
      'field_valoration_prefix',
      'field_valoration_stadistic_prefix',
    ]);
    const ratingSuffix = pickTextField(attrs, [
      'field_rating_suffix',
      'field_valoration_suffix',
      'field_valoration_stadistic_suffix',
    ]);
    const satisfactionPrefix = pickTextField(attrs, [
      'field_satisfaction_prefix',
      'field_satisfaction_stadistic_prefix',
    ]);
    const satisfactionSuffix = pickTextField(attrs, [
      'field_satisfaction_suffix',
      'field_satisfaction_stadistic_suffix',
    ]);

    return {
      paragraphId: (raw.data as any)?.data?.id ?? null,
      paragraphInternalId: attrs.drupal_internal__id ?? null,
      parentId: attrs.parent_id ?? null,
      bundle,
      students: extractText(attrs.field_estudiants_stadistic ?? attrs.field_students) ?? null,
      courses: extractText(attrs.field_courses_stadistic ?? attrs.field_courses_count) ?? null,
      rating: extractText(attrs.field_valoration_stadistic ?? attrs.field_rating) ?? null,
      satisfaction: extractText(attrs.field_satisfaction_stadistic ?? attrs.field_satisfaction) ?? null,
      studentsPrefix,
      studentsSuffix,
      coursesPrefix,
      coursesSuffix,
      ratingPrefix,
      ratingSuffix,
      satisfactionPrefix,
      satisfactionSuffix,
    };
  } catch (err) {
    console.error('[Courses] Error fetchCoursesStats:', err);
    return null;
  }
}

// Grid
async function fetchCoursesGrid(comp: any, lang: string, fallback: string): Promise<CoursesGridData | null> {
  try {
    const bundle = getParagraphBundle(comp.type);

    // Fetch container to find course references
    const containerParams = new DrupalJsonApiParams();
    containerParams.addFields(`paragraph--${bundle}`, [
      'id',
      'drupal_internal__id',
      'parent_id',
      'field_title',
      'field_courses',
    ]);

    const containerRaw = await fetchWithLangFallback<Record<string, unknown>>(
      `/jsonapi/paragraph/${bundle}/${comp.id}?${containerParams.getQueryString()}`,
      lang,
      fallback,
    );

    if (containerRaw.status !== 200) return null;

    const rawItem = (containerRaw.data as any)?.data ?? null;
    const attrs = rawItem?.attributes ?? {};
    const courseRefs = rawItem?.relationships?.field_courses?.data ?? [];
    const itemsPerLoad = extractNumber(attrs.field_items_per_load ?? attrs.field_courses_per_load) ?? 6;

    if (!courseRefs.length) {
      return {
        paragraphId: rawItem?.id ?? null,
        paragraphInternalId: attrs.drupal_internal__id ?? null,
        parentId: attrs.parent_id ?? null,
        bundle,
        title: extractText(attrs.field_title) ?? null,
        subtitle: extractText(attrs.field_subtitle) ?? null,
        courses: [],
        itemsPerLoad,
      };
    }

    // Determine bundle of referenced courses
    const courseBundleRaw = courseRefs[0]?.type ?? '';
    const courseBundle = getParagraphBundle(courseBundleRaw);

    // Fetch courses with media includes
    const courseParams = new DrupalJsonApiParams();
    courseParams
      .addInclude(['field_head_photo', 'field_head_photo.field_media_image', 'field_modality'])
      .addFields(`paragraph--${courseBundle}`, [
        'id',
        'drupal_internal__id',
        'field_title',
        'field_description',
        'field_duration',
        'field_schedule',
        'field_course_page',
        'field_head_photo',
        'field_modality',
      ])
      .addFields('taxonomy_term--course_modality', ['name'])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri'])
      .addPageLimit(50);

    const coursesRaw = await fetchWithLangFallback<Record<string, unknown>>(
      `/jsonapi/paragraph/${courseBundle}?${courseParams.getQueryString()}`,
      lang,
      fallback,
    );

    let courses: CourseItem[] = [];
    if (coursesRaw.status === 200) {
      const uuidSet = new Set(courseRefs.map((ref: any) => ref.id));
      const allCourses = (dataFormatter.deserialize(coursesRaw.data) as any[]) ?? [];
      courses = allCourses
        .filter((course: any) => uuidSet.has(course.id))
        .map((course: any) => normalizeCourse(course, courseBundle));
    }

    return {
      paragraphId: rawItem?.id ?? null,
      paragraphInternalId: attrs.drupal_internal__id ?? null,
      parentId: attrs.parent_id ?? null,
      bundle,
      title: extractText(attrs.field_title) ?? null,
      subtitle: extractText(attrs.field_subtitle) ?? null,
      courses,
      itemsPerLoad,
    };
  } catch (err) {
    console.error('[Courses] Error fetchCoursesGrid:', err);
    return null;
  }
}
