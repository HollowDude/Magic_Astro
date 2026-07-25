import { useState, useEffect } from 'react';
import type { PortfolioEventItem, PortfolioEventCategory } from '@/types/nodehive/content';

interface Props {
  lang: 'es' | 'en';
  events: PortfolioEventItem[];
  categories: PortfolioEventCategory[];
  itemsPerLoad: number;
  galleryParagraphInternalId: number | null;
  pageInternalId: number | null;
}

const LABELS = {
  es: { all: 'Todos', loadMore: 'Cargar más', close: 'Cerrar', prev: 'Anterior', next: 'Siguiente' },
  en: { all: 'All', loadMore: 'Load more', close: 'Close', prev: 'Previous', next: 'Next' },
} as const;

export default function PortfolioClient({ lang, events, categories, itemsPerLoad, galleryParagraphInternalId, pageInternalId }: Props) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(itemsPerLoad);
  const [lightbox, setLightbox] = useState<{
    eventIndex: number;
    imageIndex: number;
  } | null>(null);
  const [isInEditor, setIsInEditor] = useState(false);

  useEffect(() => {
    setIsInEditor(typeof window !== 'undefined' && window.self !== window.top);
  }, []);

  const t = LABELS[lang];

  const filteredEvents = activeFilter === 'all'
    ? events
    : events.filter(e => e.category?.slug === activeFilter);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = filteredEvents.length > visibleCount;

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-3 mb-10 pb-4 border-b border-border">
        <button
          onClick={() => { setActiveFilter('all'); setVisibleCount(itemsPerLoad); }}
          className={`inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-medium font-body cursor-pointer transition-all ${
            activeFilter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white border border-border text-body-color hover:border-primary hover:text-primary hover:bg-primary/5'
          }`}
        >
          {t.all}
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveFilter(cat.slug); setVisibleCount(itemsPerLoad); }}
            className={`inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-medium font-body cursor-pointer transition-all ${
              activeFilter === cat.slug
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-border text-body-color hover:border-primary hover:text-primary hover:bg-primary/5'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {visibleEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-[3rem] text-muted opacity-40">photo_library</span>
          <p className="font-body text-body-color mt-4">
            {lang === 'en' ? 'No events found.' : 'No se encontraron eventos.'}
          </p>
        </div>
      )}

      {/* Masonry grid */}
      {visibleEvents.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 [column-gap:1.5rem]">
          {visibleEvents.map((event, eventIdx) =>
            event.images.map((img, imgIdx) => (
              <div
                key={`${event.id}-${imgIdx}`}
                className="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 mb-6"
                onClick={() => setLightbox({ eventIndex: eventIdx, imageIndex: imgIdx })}
                data-nodehive-entity-type="paragraph"
                data-nodehive-entity-bundle={event.bundle}
                data-nodehive-entity-id={event.id}
                data-nodehive-entity-internal-id={event.internalId ?? undefined}
                data-nodehive-parent_id={galleryParagraphInternalId ?? undefined}
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  data-nodehive-field="field_gallery"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <h3
                    className="text-white font-bold text-lg font-body"
                    data-nodehive-field="field_title"
                  >
                    {event.title}
                  </h3>
                  {event.subtitle && (
                    <p
                      className="text-slate-200 text-sm font-body"
                      data-nodehive-field="field_subtitle"
                    >
                      {event.subtitle}
                    </p>
                  )}
                  {event.category && (
                    <span className="mt-1 inline-block text-xs font-bold text-white/75 uppercase tracking-widest font-body">
                      {event.category.name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Load More / Edit Section */}
      <div className="flex justify-center items-center gap-4 mt-16">
        {hasMore && (
          <button
            onClick={() => setVisibleCount(c => c + itemsPerLoad)}
            className="flex items-center gap-2 px-8 py-3 rounded-full border border-border text-body-color font-medium font-body hover:border-primary hover:text-primary transition-colors cursor-pointer bg-white"
          >
            <span>{t.loadMore}</span>
            <span className="material-symbols-outlined text-base leading-none">expand_more</span>
          </button>
        )}
        {isInEditor && (
          <button
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer bg-white"
            data-nodehive-field="field_events_amount"
            aria-label={lang === 'en' ? 'Edit gallery settings' : 'Editar configuración de galería'}
          >
            <span className="material-symbols-outlined text-base leading-none">edit</span>
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <PortfolioLightbox
          events={visibleEvents}
          eventIndex={lightbox.eventIndex}
          imageIndex={lightbox.imageIndex}
          onClose={() => setLightbox(null)}
          onChange={(eIdx, iIdx) => setLightbox({ eventIndex: eIdx, imageIndex: iIdx })}
          lang={lang}
        />
      )}
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

interface LightboxProps {
  events: PortfolioEventItem[];
  eventIndex: number;
  imageIndex: number;
  onClose: () => void;
  onChange: (eventIndex: number, imageIndex: number) => void;
  lang: 'es' | 'en';
}

function PortfolioLightbox({ events, eventIndex, imageIndex, onClose, onChange, lang }: LightboxProps) {
  const t = LABELS[lang];

  function goNext() {
    const currentEvent = events[eventIndex];
    if (imageIndex < currentEvent.images.length - 1) {
      onChange(eventIndex, imageIndex + 1);
    } else if (eventIndex < events.length - 1) {
      onChange(eventIndex + 1, 0);
    }
  }

  function goPrev() {
    if (imageIndex > 0) {
      onChange(eventIndex, imageIndex - 1);
    } else if (eventIndex > 0) {
      const prevEvent = events[eventIndex - 1];
      onChange(eventIndex - 1, prevEvent.images.length - 1);
    }
  }

  const isFirst = eventIndex === 0 && imageIndex === 0;
  const isLast = eventIndex === events.length - 1 && imageIndex === events[eventIndex].images.length - 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [eventIndex, imageIndex]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const currentEvent = events[eventIndex];
  const currentImage = currentEvent.images[imageIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-5xl w-full max-h-[90vh] px-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
        />

        {/* Event info */}
        <div className="mt-4 text-center">
          <h3 className="font-body font-bold text-white text-lg">{currentEvent.title}</h3>
          {currentEvent.subtitle && (
            <p className="font-body text-white/70 text-sm mt-1">{currentEvent.subtitle}</p>
          )}
          {currentEvent.category && (
            <span className="inline-block mt-2 text-xs font-bold text-primary uppercase tracking-widest font-body">
              {currentEvent.category.name}
            </span>
          )}
          <p className="text-white/40 text-xs font-body mt-1">
            {imageIndex + 1} / {currentEvent.images.length}
            {events.length > 1 && ` · ${lang === 'en' ? 'Event' : 'Evento'} ${eventIndex + 1}/${events.length}`}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors"
          aria-label={t.close}
        >
          <span className="material-symbols-outlined text-xl leading-none">close</span>
        </button>

        {/* Previous button */}
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          aria-label={t.prev}
        >
          <span className="material-symbols-outlined text-2xl leading-none">chevron_left</span>
        </button>

        {/* Next button */}
        <button
          onClick={goNext}
          disabled={isLast}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          aria-label={t.next}
        >
          <span className="material-symbols-outlined text-2xl leading-none">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
