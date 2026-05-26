import { useState, useEffect, useCallback } from 'react';

interface RibbonColorInfo {
  name: string;
  hex: string;
}

interface CartItem {
  itemId: number;
  orderId: number;
  variationId: number | null;
  title: string;
  sku: string;
  price: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
  thumbnailUrl: string | null;
  hasCard: boolean;
  cardMessage: string | null;
  ribbonColor: RibbonColorInfo | null;
}

interface CartData {
  items: CartItem[];
  totalItems: number;
  totalPrice: string;
}

interface Props {
  lang: 'es' | 'en';
}

const T: Record<string, Record<string, string>> = {
  es: {
    title: 'Mi Carrito',
    empty: 'Tu carrito está vacío',
    empty_desc: 'Agrega productos desde nuestra tienda para empezar.',
    browse: 'Explorar tienda',
    product: 'Producto',
    price: 'Precio',
    quantity: 'Cantidad',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    shipping_free: 'Gratis',
    remove: 'Eliminar',
    remove_confirm: '¿Eliminar este producto del carrito?',
    clear: 'Vaciar carrito',
    clear_confirm: '¿Vaciar todo el carrito?',
    checkout: 'Ir al checkout',
    continue: 'Continuar comprando',
    order_total: 'Total del pedido',
    loading: 'Cargando carrito...',
    error: 'Error al cargar el carrito.',
    retry: 'Reintentar',
    updating: 'Actualizando...',
    summary: 'Resumen',
    'cart.with_card': 'Con tarjeta',
    'cart.with_ribbon': 'Con cinta',
  },
  en: {
    title: 'My Cart',
    empty: 'Your cart is empty',
    empty_desc: 'Add products from our shop to get started.',
    browse: 'Browse shop',
    product: 'Product',
    price: 'Price',
    quantity: 'Qty',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    shipping_free: 'Free',
    remove: 'Remove',
    remove_confirm: 'Remove this item from your cart?',
    clear: 'Clear cart',
    clear_confirm: 'Clear entire cart?',
    checkout: 'Checkout',
    continue: 'Continue shopping',
    order_total: 'Order total',
    loading: 'Loading cart...',
    error: 'Error loading cart.',
    retry: 'Retry',
    updating: 'Updating...',
    summary: 'Summary',
    'cart.with_card': 'With card',
    'cart.with_ribbon': 'With ribbon',
  },
};

function t(lang: string, key: string): string {
  return T[lang]?.[key] ?? T.en[key] ?? key;
}

export default function CartManager({ lang }: Props) {
  const [data, setData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [clearing, setClearing] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/cart/');
      if (!res.ok) throw new Error('Failed');
      const json: CartData = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingIds(prev => new Set(prev).add(item.itemId));
    try {
      const res = await fetch(`/api/cart/items/${item.itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: item.orderId, quantity: newQty }),
      });
      if (!res.ok) throw new Error('Failed');
      window.dispatchEvent(new CustomEvent('cart:updated'));
      await fetchCart();
    } catch {
      // silent
    } finally {
      setUpdatingIds(prev => { const s = new Set(prev); s.delete(item.itemId); return s; });
    }
  };

  const removeItem = async (item: CartItem) => {
    if (!window.confirm(t(lang, 'remove_confirm'))) return;
    setUpdatingIds(prev => new Set(prev).add(item.itemId));
    try {
      const res = await fetch(`/api/cart/items/${item.itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: item.orderId }),
      });
      if (!res.ok) throw new Error('Failed');
      window.dispatchEvent(new CustomEvent('cart:updated'));
      await fetchCart();
    } catch {
      // silent
    } finally {
      setUpdatingIds(prev => { const s = new Set(prev); s.delete(item.itemId); return s; });
    }
  };

  const handleClear = async () => {
    if (!data?.items.length) return;
    if (!window.confirm(t(lang, 'clear_confirm'))) return;
    setClearing(true);
    try {
      const orderId = data.items[0].orderId;
      const res = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      if (!res.ok) throw new Error('Failed');
      window.dispatchEvent(new CustomEvent('cart:updated'));
      await fetchCart();
    } catch {
      // silent
    } finally {
      setClearing(false);
    }
  };

  const shopHref = `/${lang}/shop`;
  const isCartEmpty = !data || data.items.length === 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl text-headline font-semibold">{t(lang, 'title')}</h1>
        <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
          <p className="text-body-color">{t(lang, 'loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl text-headline font-semibold">{t(lang, 'title')}</h1>
        <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
          <p className="text-red-500">{t(lang, 'error')}</p>
          <button onClick={fetchCart} className="btn-primary mt-4">{t(lang, 'retry')}</button>
        </div>
      </div>
    );
  }

  if (isCartEmpty) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl text-headline font-semibold">{t(lang, 'title')}</h1>
        <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-muted opacity-30 mb-3 block">shopping_cart</span>
          <h2 className="font-heading text-xl text-headline mb-2">{t(lang, 'empty')}</h2>
          <p className="text-body-color mb-6">{t(lang, 'empty_desc')}</p>
          <a href={shopHref} className="btn-primary inline-flex">{t(lang, 'browse')}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-headline font-semibold">
          {t(lang, 'title')} ({data.totalItems} {data.totalItems === 1 ? 'artículo' : 'artículos'})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* ═══ Items ═══ */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-blush/50">
                <th className="font-body text-xs font-bold uppercase tracking-widest text-muted px-5 py-3.5">{t(lang, 'product')}</th>
                <th className="font-body text-xs font-bold uppercase tracking-widest text-muted px-5 py-3.5 hidden sm:table-cell">{t(lang, 'price')}</th>
                <th className="font-body text-xs font-bold uppercase tracking-widest text-muted px-5 py-3.5 text-center">{t(lang, 'quantity')}</th>
                <th className="font-body text-xs font-bold uppercase tracking-widest text-muted px-5 py-3.5 text-right hidden sm:table-cell">{t(lang, 'total')}</th>
                <th className="w-14 px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const isUpdating = updatingIds.has(item.itemId);
                return (
                  <tr key={item.itemId} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-blush shrink-0">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-xl text-primary opacity-40 leading-none">local_florist</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-headline truncate">{item.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {item.hasCard && (
                              <span className="inline-flex items-center font-body text-muted" title={item.cardMessage ?? `Con tarjeta`}>
                                <span className="material-symbols-outlined !text-sm leading-none">mail</span>
                              </span>
                            )}
                            {item.ribbonColor && (
                              <span className="inline-flex items-center gap-1 font-body text-[11px] text-muted" title={t(lang, 'cart.with_ribbon')}>
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.ribbonColor.hex, border: '1px solid rgba(0,0,0,0.12)' }} />
                              </span>
                            )}
                          </div>
                          <span className="sm:hidden font-body text-xs font-bold text-primary mt-1 block">{item.price}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell align-middle">
                      <span className="font-body text-sm text-body-color">{item.price}</span>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating}
                          className="flex items-center justify-center w-7 h-7 rounded-full bg-blush text-headline border-none cursor-pointer transition-colors hover:bg-primary/15 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <span className="material-symbols-outlined !text-sm leading-none">remove</span>
                        </button>
                        <span className="w-8 text-center font-body text-sm font-bold text-headline tabular-nums select-none">
                          {isUpdating ? (
                            <span className="inline-block w-3 h-3 rounded-full border-2 border-border border-t-primary animate-spin" />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          disabled={isUpdating}
                          className="flex items-center justify-center w-7 h-7 rounded-full bg-blush text-headline border-none cursor-pointer transition-colors hover:bg-primary/15 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <span className="material-symbols-outlined !text-sm leading-none">add</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right hidden sm:table-cell align-middle">
                      <span className="font-body text-sm font-bold text-headline">{item.totalPrice}</span>
                    </td>
                    <td className="px-5 py-4 text-right align-middle">
                      <button
                        onClick={() => removeItem(item)}
                        disabled={isUpdating}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-muted hover:text-red-500 hover:bg-red-50 border-none cursor-pointer transition-colors disabled:opacity-50"
                        aria-label={t(lang, 'remove')}
                      >
                        <span className="material-symbols-outlined !text-lg leading-none">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-blush/30">
            <button
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center gap-1.5 font-body text-sm font-bold text-muted hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined !text-base leading-none">delete_sweep</span>
              {clearing ? t(lang, 'updating') : t(lang, 'clear')}
            </button>
            <a href={shopHref} className="font-body text-sm font-bold text-primary no-underline hover:underline">
              ← {t(lang, 'continue')}
            </a>
          </div>
        </div>

        {/* ═══ Summary ═══ */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 sticky top-28">
          <h2 className="font-heading text-lg font-semibold text-headline mb-5">{t(lang, 'summary')}</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-body-color">{t(lang, 'subtotal')}</span>
              <span className="font-body text-sm font-semibold text-headline">{data.totalPrice}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-body-color">{t(lang, 'shipping')}</span>
              <span className="font-body text-sm font-semibold text-sage">{t(lang, 'shipping_free')}</span>
            </div>
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <span className="font-body text-base font-bold text-headline">{t(lang, 'order_total')}</span>
              <span className="font-heading text-xl font-bold text-headline">{data.totalPrice}</span>
            </div>
          </div>

          <button
            disabled
            className="btn-primary w-full mt-6 h-12 opacity-60 cursor-not-allowed"
          >
            {t(lang, 'checkout')}
          </button>
          <p className="font-body text-xs text-muted text-center mt-2">(Próximamente)</p>
        </div>
      </div>
    </div>
  );
}
