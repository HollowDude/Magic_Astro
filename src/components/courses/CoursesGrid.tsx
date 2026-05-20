// src/components/courses/CoursesGrid.tsx
import { useState, useMemo } from 'react';
import type { CourseItem, CourseFormat } from '@/types/nodehive/content';
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

const FALLBACK_COURSES: CourseItem[] = [
  {
    id: '1',
    internalId: 1,
    bundle: 'course',
    title: 'Wedding Floral Design Masterclass',
    description: 'Domina los arreglos florales para bodas con materiales premium. Grupos reducidos y certificado incluido.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyr3QyYkCtCer78riD1x7KeJ_hkZLzi9-G06WL9tLEAFxe0LjtriEj2GOuksWxSWaxPKqkxL1AGMUjj2qRVQNDhC6dVEa39FQVfqp4Pb1YiQx9HQT6nvt1UP1gYQDpFQStPrDq4ZJyhnylOi27QX5P4mgMj_HPk2mvW4VUFU7dP7Rrabv8OVheuXnFoaj0K0EoB161lqCM4dKIY1bm6GB0CBVJqPyYZmOKfkw-RqQ6jz8-0bEWnZjUahVzN113oRB8CCDGuysTitA',
    price: '$450',
    isFree: false,
    format: 'in-person',
    level: 'intermediate',
    date: 'Oct 15-16',
    duration: '2 dias · 10am-4pm',
    rating: 4.8,
    reviewCount: 94,
    spotsLeft: null,
    ctaUrl: '#',
  },
  {
    id: '2',
    internalId: 2,
    bundle: 'course',
    title: 'Spring Bouquet Arrangement Basics',
    description: 'Crea bouquets primaverales vibrantes desde cero. Acceso de por vida y recursos descargables.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOzJz3te1RQZcAxlsrBTtSoS__ex9QDYoQcoha3hSORRM_vc99ZJG3MXDNJJt2qIVby8EC83zW1yRS0FlF-v2oy3N6PiS4vDR2sTCSrx9fhE317JQQUt95lKXj-i_-lKUWRqx6DeScg4nQqNSOEPpBxHKoegdK04Wx787xLhH5sZqBJnze8vBqWqpuwq-tSaKOYM2LoPl-viX-W5L7b8EW8GySoZK-4AXs9ljTA4T3PTnmAyFnKnCB7OF7JoYOEBvMt3iEDhjhL_U',
    price: '$120',
    isFree: false,
    format: 'digital',
    level: 'beginner',
    date: null,
    duration: '3 h de video',
    rating: 4.9,
    reviewCount: 128,
    spotsLeft: null,
    ctaUrl: '#',
  },
  {
    id: '3',
    internalId: 3,
    bundle: 'course',
    title: 'Advanced Dried Installations',
    description: 'Instalaciones con flores secas para eventos. Tecnicas avanzadas y tendencias actuales de decoracion.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8xjA2WDspQmiGOC7vOfzZ6BaqZiGX-1oj6F5w1edfFo-PQ_GsSJIosOT9WUsK9M8_GIT-iuCv-MYHHKMdUz4nmaOHFK9JPGQBW8fSniRb1i5pXkBknNvEuopaYlD6k_X6MsI1iB-GNpt3w_MCmdEYfQS_T3t-hOxFRoRXHoF724OX-ccWBq2QpSUYeaSere1VYBXJD8y_AIoaOvTR_rLsDmpyVSsTMIerh1Z_vFvlUpFTY-NYI2Ar0ea4XARwMsghkYkk0BLHllQ',
    price: '$350',
    isFree: false,
    format: 'workshop',
    level: 'advanced',
    date: 'Nov 12',
    duration: '1 dia · 9am-5pm',
    rating: 4.7,
    reviewCount: 41,
    spotsLeft: 12,
    ctaUrl: '#',
  },
  {
    id: '4',
    internalId: 4,
    bundle: 'course',
    title: 'Sustainable Floristry Practices',
    description: 'Diseno floral responsable con el ambiente. Flores de temporada, tecnicas eco-friendly y tendencias verdes.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlF5WpIenAlKuoVRHr-nDZxLbm1SaVnUet49AF1MS9MMYO3gsHExvqvCX4LzkGibAuE-QmHCWF0GIwpFfzq8vxL2sjPpzNmZGOAZ-ViySRnEgmk-QIh0p0M5rlF1xHUJ3RDTGSRX2VpvzrFi701G55b5wtnU2rF2rGHjZ168wvzgKWy4Yz2sg1Pni1ZpE6Lniyntakvw64HH9m2DPuz0PaxRAqwSnvmex5wFRCHH64qM4lokNr0YkQT1kAv4AqrDSyzQr3n6SeZHw',
    price: '$95',
    isFree: false,
    format: 'digital',
    level: 'all',
    date: null,
    duration: '2.5 h de video',
    rating: 5.0,
    reviewCount: 56,
    spotsLeft: null,
    ctaUrl: '#',
  },
  {
    id: '5',
    internalId: 5,
    bundle: 'course',
    title: 'Taller de Arreglos Primaverales',
    description: 'Arreglos frescos con flores de temporada. Ideal para principiantes con un ambiente acogedor y divertido.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQHqqd-0T9HcGNUZsyD2DGRqx_wQj8W-JVW7YSrJKpIpQkF0WSbLuoQhBFX2NBcvbk0MQtzcWrCti9y_Qht705Tchruso8qyXzLhEr6hCqIackICZBtKopCmBLR5wWQDcdhX_mj745Ix5MDXS91jQ4_iR83sixSqALBzc3NM3_rEhIFnDgp__8NKEshauJEYfLmnPvB8uwShLZl5dtxaa3B3oa5lP0nVp-rhWJO6nPEcuUBzfT-xF-T36xDg_VDz1PP5eb1auoF8I',
    price: '$280',
    isFree: false,
    format: 'in-person',
    level: 'beginner',
    date: 'Dic 5',
    duration: 'Medio dia · 10am-2pm',
    rating: 4.9,
    reviewCount: 72,
    spotsLeft: null,
    ctaUrl: '#',
  },
  {
    id: '6',
    internalId: 6,
    bundle: 'course',
    title: 'Introduccion a la Teoria del Color Floral',
    description: 'Psicologia del color aplicada a los arreglos florales. Curso introductorio gratuito para empezar.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8mwchEpkUA8pbOZR9WjHrkpXY7VSPnp5FFg9882n83E9Spru1bfmnVEycZFPu0uVu23Ho9Y6Ci9aO_WkuwhN_rBo_OQkhth0WjBTtZYjV2iwAEZpeuucQEub5uJTz5EAIe8YXxNCtGR3qfR9-FOHyn2ZXtdDFHj1NHaNEbIVcZGMrvYG5RZZ4NGf3sJtO2pPhUOuJGdIiT1E6CboXLivRDEvaS01gtUQ_5LNL6SYAw_WTFcI4KmhP-H9FUhjNC3aYnDFkXoBaDuo',
    price: null,
    isFree: true,
    format: 'digital',
    level: 'beginner',
    date: null,
    duration: '45 min',
    rating: 4.6,
    reviewCount: 203,
    spotsLeft: null,
    ctaUrl: '#',
  },
];

const FORMAT_BADGE: Record<CourseFormat, { label: string; labelEn: string; classes: string }> = {
  'in-person': { label: 'Presencial', labelEn: 'In-Person', classes: 'bg-[#e1f0e1] text-[#2a6b2a]' },
  'digital': { label: 'Digital', labelEn: 'Digital', classes: 'bg-blush text-primary border border-primary/20' },
  'workshop': { label: 'Taller', labelEn: 'Workshop', classes: 'bg-[#fff8e6] text-[#9a6c00]' },
};

interface Props {
  courses?: CourseItem[];
  title?: string | null;
  subtitle?: string | null;
  itemsPerLoad?: number;
  lang?: Lang;
  paragraphId?: string | null;
  paragraphInternalId?: number | null;
  parentId?: string | number | null;
  bundle?: string;
}

export default function CoursesGrid({
  courses: coursesProp,
  title,
  subtitle,
  itemsPerLoad = 6,
  lang = 'es',
  paragraphId,
  paragraphInternalId,
  parentId,
  bundle,
}: Props) {
  const courses = (coursesProp && coursesProp.length > 0) ? coursesProp : FALLBACK_COURSES;
  const [activeFilter, setActiveFilter] = useState<CourseFormat | 'all'>('all');
  const [visible, setVisible] = useState(itemsPerLoad);

  const filtered = useMemo(
    () => activeFilter === 'all' ? courses : courses.filter((c) => c.format === activeFilter),
    [courses, activeFilter],
  );
  const paginated = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;

  const filters: { key: CourseFormat | 'all'; label: string }[] = [
    { key: 'all', label: t(lang, 'courses.filter.all') },
    { key: 'in-person', label: t(lang, 'courses.filter.inperson') },
    { key: 'digital', label: t(lang, 'courses.filter.digital') },
    { key: 'workshop', label: t(lang, 'courses.filter.workshop') },
  ];

  return (
    <main
      id="cursos"
      className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-10 py-10 flex flex-col gap-8"
      data-nodehive-entity-type={bundle ? 'paragraph' : undefined}
      data-nodehive-entity-bundle={bundle ?? undefined}
      data-nodehive-entity-id={paragraphId ?? undefined}
      data-nodehive-entity-internal-id={paragraphInternalId ?? undefined}
      data-nodehive-parent_id={parentId ?? undefined}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-2xl md:text-3xl text-[#89656b] font-heading font-semibold leading-tight"
            data-nodehive-field="field_title"
          >
            {title ?? (lang === 'es' ? 'Cursos disponibles' : 'Available courses')}
          </h2>
          <p
            className="text-sm mt-1 text-body-color"
            data-nodehive-field="field_subtitle"
          >
            {subtitle ?? (lang === 'es' ? 'Elige el formato que mejor se adapte a ti' : 'Choose the format that works best for you')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2" data-nodehive-field="field_filters">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => { setActiveFilter(filter.key); setVisible(itemsPerLoad); }}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                activeFilter === filter.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-slate-200 text-[#89656b] hover:border-primary/40'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {paginated.length === 0 ? (
        <p className="text-center text-body-color py-12">{t(lang, 'courses.no_courses')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((course) => (
            <CourseCard key={course.id} course={course} lang={lang} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisible((v) => v + itemsPerLoad)}
            className="flex items-center gap-2 px-7 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:border-primary/40 hover:text-primary transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
            {t(lang, 'courses.load_more')}
          </button>
        </div>
      )}
    </main>
  );
}

function CourseCard({ course, lang }: { course: CourseItem; lang: Lang }) {
  const badge = FORMAT_BADGE[course.format];
  const isEn = lang === 'en';

  const levelLabels: Record<string, string> = {
    beginner: t(lang, 'courses.level.beginner'),
    intermediate: t(lang, 'courses.level.intermediate'),
    advanced: t(lang, 'courses.level.advanced'),
    all: t(lang, 'courses.level.all'),
  };

  return (
    <article
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:shadow-[0_8px_28px_rgba(0,0,0,.1)] hover:-translate-y-0.5"
      data-nodehive-entity-type="paragraph"
      data-nodehive-entity-bundle={course.bundle}
      data-nodehive-entity-id={course.id}
      data-nodehive-entity-internal-id={course.internalId ?? undefined}
    >
      <div className="relative h-48 overflow-hidden">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
            data-nodehive-field="field_image"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blush">
            <span className="material-symbols-outlined text-5xl text-primary opacity-30">school</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

        <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${badge.classes}`}>
          {isEn ? badge.labelEn : badge.label}
        </span>

        <span
          className="absolute top-3 right-3 bg-black/50 text-white text-xs font-black px-2.5 py-1 rounded-full"
          data-nodehive-field="field_price"
        >
          {course.isFree ? t(lang, 'courses.free') : course.price}
        </span>

        {course.spotsLeft != null && (
          <span className="absolute bottom-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            {course.spotsLeft} {t(lang, 'courses.spots_left')}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex-1">
          <h3
            className="text-base font-bold text-slate-900 leading-snug mb-1"
            data-nodehive-field="field_title"
          >
            {course.title}
          </h3>
          {course.description && (
            <p
              className="text-[#89656b] text-sm leading-relaxed max-h-[4.5rem] overflow-y-auto pr-1"
              data-nodehive-field="field_description"
            >
              {course.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#89656b]">
          {course.date && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              {course.date}
            </span>
          )}
          {course.duration && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {course.duration}
            </span>
          )}
          {course.level && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">bar_chart</span>
              {levelLabels[course.level] ?? course.level}
            </span>
          )}
        </div>

        {course.rating != null && (
          <div className="flex items-center gap-1 text-xs">
            <span
              className="material-symbols-outlined text-yellow-400 text-[14px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="font-bold text-slate-900">{course.rating.toFixed(1)}</span>
            {course.reviewCount != null && (
              <span className="text-[#89656b]">
                ({course.reviewCount} {t(lang, 'courses.reviews')})
              </span>
            )}
          </div>
        )}

        <a
          href={course.ctaUrl ?? '#'}
          target={course.ctaUrl?.startsWith('http') ? '_blank' : undefined}
          rel={course.ctaUrl?.startsWith('http') ? 'noopener' : undefined}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-all"
          data-nodehive-field="field_cta_url"
        >
          {t(lang, 'courses.view')}
          <span className="material-symbols-outlined text-[15px]">open_in_new</span>
        </a>
      </div>
    </article>
  );
}
