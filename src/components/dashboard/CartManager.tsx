import { useState, useEffect, useCallback, Fragment } from 'react';

interface RibbonColorInfo {
  name: string;
  hex: string;
}

interface CartItemAddition {
  orderItemId: number; title: string; unitPrice: string;
  totalPrice: string; quantity: number; thumbnailUrl: string | null;
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
  additions: CartItemAddition[];
  isAddition: boolean;
}

interface CartData {
  items: CartItem[];
  totalItems: number;
  totalPrice: string;
  hasActiveCheckout?: boolean;
  activeCheckoutOrderUuid?: string;
}

interface ShippingConfig {
  deliveryPrice: number;
  deliveryCurrency: string;
  deliveryLabel: string;
  deliveryTime: string;
  pickupLabel: string;
  pickupTime: string;
  pickupAddress: string;
  pickupPrice: number;
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
    shipping_optional: 'Opcional',
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
    refresh: 'Actualizar carrito',
    refreshing: 'Actualizando...',
    'cart.with_card': 'Con tarjeta',
    'cart.with_ribbon': 'Con cinta',
    'cart.with_additions': 'Con extras',
    'cart.additions_section': 'Extras incluidos',
    'cart.additions_subtotal': 'Subtotal extras',
    checkout_in_progress: 'Tu carrito está en proceso de pago',
    checkout_in_progress_desc: 'Tienes un pedido en proceso. Puedes continuarlo o cancelarlo.',
    continue_checkout: 'Continuar checkout',
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
    shipping_optional: 'Optional',
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
    refresh: 'Refresh cart',
    refreshing: 'Refreshing...',
    'cart.with_card': 'With card',
    'cart.with_ribbon': 'With ribbon',
    'cart.with_additions': 'With extras',
    'cart.additions_section': 'Included extras',
    'cart.additions_subtotal': 'Extras subtotal',
    checkout_in_progress: 'Your cart is being processed',
    checkout_in_progress_desc: 'You have an order in progress. You can continue or cancel it.',
    continue_checkout: 'Continue checkout',
  },
};

function t(lang: string, key: string): string {
  return T[lang]?.[key] ?? T.en[key] ?? key;
}

function parseMoney(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(amount: number, sample: string): string {
  const trimmed = (sample ?? '').trim();
  const symbol = trimmed.replace(/[0-9.,\s-]/g, '');
  const formatted = amount.toFixed(2);
  if (!symbol) return formatted;
  return trimmed.startsWith(symbol) ? `${symbol}${formatted}` : `${formatted}${symbol}`;
}

function computeTotals(items: CartItem[], sampleTotal: string): { totalItems: number; totalPrice: string } {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalNumber = items.reduce((sum, i) => {
    const unit = parseMoney(i.unitPrice ?? '0');
    return sum + (unit * i.quantity);
  }, 0);
  const totalPrice = formatMoney(totalNumber, sampleTotal);
  return { totalItems, totalPrice };
}

export default function CartManager({ lang }: Props) {
  const [data, setData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [clearing, setClearing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);

  const emitCartUpdated = useCallback((next: CartData | null) => {
    if (!next) return;
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: next }));
  }, []);

  const emitCartLoading = useCallback((active: boolean, source: string) => {
    window.dispatchEvent(new CustomEvent('cart:loading', { detail: { active, source } }));
  }, []);

  const fetchCart = useCallback(async ({ silent }: { silent?: boolean } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/cart/', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Not OK');
      const json = await res.json();
      setData(json);
      setError(false);
    } catch {
      if (!silent) setError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  useEffect(() => {
    fetch(`/api/checkout/shipping-config?lang=${lang}`)
      .then(r => r.ok ? r.json() : null)
      .then(cfg => setShippingConfig(cfg))
      .catch(() => {});
  }, [lang]);

  const refreshCart = useCallback(async () => {
    setRefreshing(true);
    await fetchCart({ silent: true });
    setTimeout(() => setRefreshing(false), 300);
  }, [fetchCart]);

  const updateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty < 1) return;
    const snapshot = data;
    if (!snapshot) return;

    const sampleTotal = snapshot.totalPrice || snapshot.items[0]?.price || '';
    const nextItems = snapshot.items.map(i => {
      if (i.itemId !== item.itemId) return i;
      const nextTotal = formatMoney(parseMoney(i.unitPrice ?? '0') * newQty, i.totalPrice || i.price);
      return { ...i, quantity: newQty, totalPrice: nextTotal };
    });
    const totals = computeTotals(nextItems, sampleTotal);
    const nextData = { ...snapshot, items: nextItems, ...totals };
    setData(nextData);
    emitCartUpdated(nextData);

    setUpdatingIds(prev => new Set(prev).add(item.itemId));
    emitCartLoading(true, 'update');
    try {
      const res = await fetch(`/api/cart/items/${item.itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: item.orderId, quantity: newQty }),
      });
      if (!res.ok) throw new Error('Failed');
    } catch {
      setData(snapshot);
      emitCartUpdated(snapshot);
    } finally {
      setUpdatingIds(prev => { const s = new Set(prev); s.delete(item.itemId); return s; });
      emitCartLoading(false, 'update');
    }
  };

  const removeItem = async (item: CartItem) => {
    if (!window.confirm(t(lang, 'remove_confirm'))) return;
    const snapshot = data;
    if (!snapshot) return;

    setUpdatingIds(prev => new Set(prev).add(item.itemId));
    emitCartLoading(true, 'remove');

    // If flower has additions, remove them first
    if (item.additions && item.additions.length > 0) {
      for (const add of item.additions) {
        try {
          await fetch(`/api/cart/items/${add.orderItemId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: item.orderId }),
          });
        } catch {}
      }
    }

    const sampleTotal = snapshot.totalPrice || snapshot.items[0]?.price || '';
    const nextItems = snapshot.items.filter(i => i.itemId !== item.itemId && !item.additions?.some(a => a.orderItemId === i.itemId));
    const totals = computeTotals(nextItems, sampleTotal);
    const nextData = { ...snapshot, items: nextItems, ...totals };
    setData(nextData);
    emitCartUpdated(nextData);

    try {
      const res = await fetch(`/api/cart/items/${item.itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: item.orderId }),
      });
      if (!res.ok) throw new Error('Failed');
    } catch {
      setData(snapshot);
      emitCartUpdated(snapshot);
    } finally {
      setUpdatingIds(prev => { const s = new Set(prev); s.delete(item.itemId); return s; });
      emitCartLoading(false, 'remove');
    }
  };

  const removeAddition = async (add: CartItemAddition, parentOrderId: number) => {
    if (!window.confirm(t(lang, 'remove_confirm'))) return;
    const snapshot = data;
    if (!snapshot) return;

    const sampleTotal = snapshot.totalPrice || snapshot.items[0]?.price || '';
    const filteredItems = snapshot.items.filter(i => {
      if (i.isAddition && i.itemId === add.orderItemId) return false;
      return true;
    }).map(i => ({
      ...i,
      additions: i.additions.filter(a => a.orderItemId !== add.orderItemId),
    }));

    const totals = computeTotals(filteredItems, sampleTotal);
    const nextData = { ...snapshot, items: filteredItems, ...totals };
    setData(nextData);
    emitCartUpdated(nextData);

    try {
      await fetch(`/api/cart/items/${add.orderItemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: parentOrderId }),
      });
    } catch {
      setData(snapshot);
      emitCartUpdated(snapshot);
    }
  };

  const handleClear = async () => {
    if (!data?.items.length) return;
    if (!window.confirm(t(lang, 'clear_confirm'))) return;
    const snapshot = data;
    setClearing(true);
    emitCartLoading(true, 'clear');
    try {
      const orderId = data.items[0].orderId;
      const res = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      if (!res.ok) throw new Error('Failed');
      const sampleTotal = snapshot?.totalPrice || snapshot?.items[0]?.price || '';
      const nextData = { items: [], totalItems: 0, totalPrice: formatMoney(0, sampleTotal) };
      setData(nextData);
      emitCartUpdated(nextData);
    } catch {
      if (snapshot) {
        setData(snapshot);
        emitCartUpdated(snapshot);
      }
    } finally {
      setClearing(false);
      emitCartLoading(false, 'clear');
    }
  };

  const shopHref = `/${lang}/shop`;
  const isCartEmpty = !data || data.items.filter(i => !i.isAddition).length === 0;

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
          <button onClick={() => fetchCart()} className="btn-primary mt-4">{t(lang, 'retry')}</button>
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-heading text-2xl text-headline font-semibold">
          {t(lang, 'title')} ({data.items.filter(i => !i.isAddition).length} {data.items.filter(i => !i.isAddition).length === 1 ? 'artículo' : 'artículos'})
        </h1>
        <button
          onClick={refreshCart}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 font-body text-sm font-bold text-primary bg-transparent border-none cursor-pointer hover:underline disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {refreshing ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          ) : (
            <span className="material-symbols-outlined !text-lg leading-none">refresh</span>
          )}
          {refreshing ? t(lang, 'refreshing') : t(lang, 'refresh')}
        </button>
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
              {data.items.filter(i => !i.isAddition).map((item) => {
                const isUpdating = updatingIds.has(item.itemId);
                return (
                  <Fragment key={item.itemId}>
                    <tr className={`border-b border-border last:border-b-0 ${isUpdating ? 'opacity-60' : ''}`}>
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
                              {item.additions && item.additions.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 font-body text-[11px] text-sage font-semibold">
                                  <span className="material-symbols-outlined !text-sm leading-none">redeem</span>
                                  {t(lang, 'cart.with_additions')} ({item.additions.length})
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
                    {item.additions && item.additions.length > 0 && item.additions.map((add) => {
                      return (
                        <tr key={add.orderItemId} className="border-b border-border last:border-b-0" style={{background:'var(--sage-light)'}}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3" style={{paddingLeft:'2rem'}}>
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white shrink-0">
                                {add.thumbnailUrl ? (
                                  <img src={add.thumbnailUrl} alt={add.title} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-sm leading-none" style={{color:'var(--sage)'}}>redeem</span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-body text-sm font-semibold text-headline truncate">{add.title}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 hidden sm:table-cell align-middle">
                            <span className="font-body text-sm" style={{color:'var(--sage)'}}>{add.unitPrice}</span>
                          </td>
                          <td className="px-5 py-3 align-middle text-center">
                            <span className="font-body text-sm text-headline">{add.quantity}</span>
                          </td>
                          <td className="px-5 py-3 text-right hidden sm:table-cell align-middle">
                            <span className="font-body text-sm font-bold" style={{color:'var(--sage)'}}>{add.totalPrice}</span>
                          </td>
                          <td className="px-5 py-3 text-right align-middle">
                            <button
                              onClick={() => removeAddition(add, item.orderId)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-muted hover:text-red-500 hover:bg-red-50 border-none cursor-pointer transition-colors"
                              aria-label={t(lang, 'remove')}
                            >
                              <span className="material-symbols-outlined !text-lg leading-none">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
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
              <span className="font-body text-sm font-semibold text-sage">
                {shippingConfig ? `+ $${shippingConfig.deliveryPrice.toFixed(2)} (${t(lang, 'shipping_optional')})` : t(lang, 'shipping_free')}
              </span>
            </div>
            {data.items.filter(i => i.isAddition).length > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-body-color">
                  <span className="material-symbols-outlined !text-sm leading-none align-middle mr-1" style={{color:'var(--sage)'}}>redeem</span>
                  {t(lang, 'cart.additions_subtotal')}
                </span>
                <span className="font-body text-sm font-semibold" style={{color:'var(--sage)'}}>
                  {(() => {
                    const items = data.items.filter(i => i.isAddition);
                    const total = items.reduce((s, i) => s + (parseFloat(i.unitPrice || '0') * i.quantity), 0);
                    return formatMoney(total, items[0]?.totalPrice ?? '$0.00');
                  })()}
                </span>
              </div>
            )}
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <span className="font-body text-base font-bold text-headline">{t(lang, 'order_total')}</span>
              <span className="font-heading text-xl font-bold text-headline">{data.totalPrice}</span>
            </div>
          </div>

          <button
            onClick={() => { window.location.href = `/${lang}/checkout`; }}
            className="btn-primary w-full mt-6 h-12 cursor-pointer"
          >
            {t(lang, 'checkout')}
          </button>
        </div>
      </div>
    </div>

  );
}
