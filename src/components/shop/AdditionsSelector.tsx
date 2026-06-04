import { useState, useEffect } from 'react';
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

export interface SelectedAddition {
  id: string;
  variationId: number;
  variationUuid: string;
  title: string;
  price: string;
  priceNumber: number;
  thumbnailUrl: string | null;
}

interface AdditionOption {
  id: string;
  variationId: number;
  variationUuid: string;
  title: string;
  price: string;
  priceNumber: number;
  thumbnailUrl: string | null;
}

interface Props {
  lang: Lang;
  selected: SelectedAddition[];
  onChange: (additions: SelectedAddition[]) => void;
}

export default function AdditionsSelector({ lang, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AdditionOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/additions?lang=${lang}`)
      .then(r => r.json())
      .then((data: AdditionOption[]) => {
        if (!cancelled) {
          setOptions(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [lang]);

  const toggle = (opt: AdditionOption) => {
    const exists = selected.find(s => s.variationId === opt.variationId);
    if (exists) {
      onChange(selected.filter(s => s.variationId !== opt.variationId));
    } else {
      onChange([...selected, {
        id: opt.id,
        variationId: opt.variationId,
        variationUuid: opt.variationUuid,
        title: opt.title,
        price: opt.price,
        priceNumber: opt.priceNumber,
        thumbnailUrl: opt.thumbnailUrl,
      }]);
    }
  };

  const clearAll = () => onChange([]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 w-full h-12 bg-[var(--primary-blush-tint)] border border-dashed border-border rounded-2xl font-body text-sm text-muted">
        <span className="w-4 h-4 rounded-full border-2 border-muted/30 border-t-muted animate-spin" />
        {t(lang, 'product.additions.loading')}
      </div>
    );
  }

  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {open ? (
        <div className="bg-[var(--primary-blush-tint)] border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-sm font-bold text-headline">
              {t(lang, 'product.additions.title')}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-body text-xs text-muted hover:text-red-500 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 transition-colors"
            >
              {t(lang, 'product.additions.remove')}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {options.map(opt => {
              const isSelected = selected.some(s => s.variationId === opt.variationId);
              return (
                <button
                  key={opt.variationId}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 bg-white transition-all duration-150 cursor-pointer text-left ${
                    isSelected
                      ? 'border-primary bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="w-[60px] h-[60px] rounded-lg bg-[var(--blush)] overflow-hidden flex-shrink-0">
                    {opt.thumbnailUrl ? (
                      <img src={opt.thumbnailUrl} alt={opt.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[1.5rem] text-primary/30 leading-none">redeem</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-0.5 min-w-0 w-full">
                    <span className="font-body text-xs font-semibold text-headline truncate w-full text-center leading-tight">
                      {opt.title}
                    </span>
                    <span className="font-body text-xs font-bold text-primary">
                      {opt.price}
                    </span>
                    <span className="font-body text-[10px] text-muted">
                      {t(lang, 'product.additions.each')}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined !text-sm leading-none text-primary">check_circle</span>
                  )}
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-xs font-semibold text-headline">
                  {t(lang, 'product.additions.selected')} ({selected.length})
                </span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-body text-[11px] text-muted hover:text-red-500 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 transition-colors"
                >
                  {t(lang, 'product.additions.remove')}
                </button>
              </div>
              {selected.map(s => (
                <div key={s.variationId} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined !text-sm leading-none text-sage shrink-0">redeem</span>
                    <span className="font-body text-xs text-body-color truncate">{s.title}</span>
                  </div>
                  <span className="font-body text-xs font-semibold text-sage shrink-0 ml-2">{s.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex items-center justify-center gap-2 w-full h-12 bg-[var(--primary-blush-tint)] border border-dashed border-border rounded-2xl font-body text-sm font-bold text-headline hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer ${
            selected.length > 0 ? 'border-primary/60 text-primary' : ''
          }`}
        >
          <span className="material-symbols-outlined !text-lg leading-none">
            {selected.length > 0 ? 'redeem' : 'add'}
          </span>
          {selected.length > 0
            ? t(lang, 'product.additions.in_cart').replace('{n}', String(selected.length))
            : t(lang, 'product.additions.add')}
        </button>
      )}
    </div>
  );
}
