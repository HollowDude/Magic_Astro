import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CheckoutCartItem {
  itemId: number;
  title: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  variationId: number | null;
  thumbnailUrl: string | null;
  hasCard: boolean;
  ribbonColor: { name: string; hex: string } | null;
}

interface CheckoutCartData {
  orderId: number;
  totalPrice: string;
  items: CheckoutCartItem[];
}

interface UserAddress {
  id: string;
  internalId: number | null;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
  isDefault: boolean;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

interface RecipientContact {
  fullName: string;
  idType: string;
  idNumber: string;
  phone: string;
}

interface Props {
  lang: 'es' | 'en';
  cartData: string;
  userAddresses: string;
}

// ─── Translation helper ─────────────────────────────────────────────────────

const STEPS = ['shipping', 'method', 'payment', 'confirm'] as const;
type Step = typeof STEPS[number];

const STEP_LABELS: Record<string, Record<string, string>> = {
  es: { shipping: 'Envío', method: 'Método de envío', payment: 'Pago', confirm: 'Confirmación' },
  en: { shipping: 'Shipping', method: 'Shipping method', payment: 'Payment', confirm: 'Confirmation' },
};

const T: Record<string, Record<string, string>> = {
  es: {
    title: 'Checkout',
    next: 'Continuar al método de envío',
    next_payment: 'Continuar al pago',
    next_confirm: 'Revisar pedido',
    place_order: 'Procesar Pago',
    summary: 'Resumen',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    shipping_free: 'Gratis',
    shipping_pending: 'Se calcula en el siguiente paso',
    delivery: 'Delivery a domicilio',
    delivery_price: '$24.00',
    delivery_time: '1 a 3 días hábiles',
    pickup: 'Recogida en tienda',
    pickup_price: 'Gratis',
    pickup_time: 'Disponible en 24 horas',
    pickup_address: 'Av. Principal Las Mercedes, Local 4B',
    taxes: 'Impuestos',
    total: 'Total',
    discount: 'Código de descuento',
    discount_apply: 'Aplicar',
    shipping_title: 'Información de envío',
    default_address: 'Dirección predeterminada',
    change_address: 'Cambiar dirección',
    add_address: 'Agregar nueva dirección',
    cancel: 'Cancelar',
    save_address: 'Guardar en mi libreta de direcciones',
    country: 'País',
    state: 'Estado / Provincia',
    first_name: 'Nombre',
    last_name: 'Apellido',
    address1: 'Dirección línea 1',
    address2: 'Dirección línea 2 (opcional)',
    city: 'Ciudad',
    zip: 'Código Postal',
    recipient_title: 'Contacto para recibir (opcional)',
    recipient_name: 'Nombre completo',
    recipient_id: 'CI / Pasaporte',
    recipient_phone: 'Teléfono',
    method_title: 'Método de envío',
    delivery_desc: 'Recibe tu pedido en la puerta de tu casa.',
    payment_title: 'Información de pago',
    billing_same: 'Igual a la dirección de envío',
    billing_title: 'Dirección de facturación',
    card_method: 'Tarjeta de crédito / débito',
    card_processor: 'procesada mediante PayPal',
    security_note: 'Tu información de pago es procesada de forma segura mediante PayPal. No almacenamos datos de tarjetas.',
    confirm_title: 'Confirma tu pedido',
    confirm_order: 'Pedido',
    edit: 'Editar',
    no_recipient: 'No indicado',
    billing_same_as_shipping: 'Igual al envío',
    payment_method: 'Método de pago',
    success_title: '¡Pedido confirmado!',
    success_desc: 'Recibirás un correo con la confirmación de tu pedido.',
    download_receipt: 'Descargar recibo',
    continue_shopping: 'Seguir comprando',
    secure_payment: 'Pago 100% seguro y encriptado',
    secure_paypal: 'Pago procesado de forma segura via PayPal',
  },
  en: {
    title: 'Checkout',
    next: 'Continue to shipping method',
    next_payment: 'Continue to payment',
    next_confirm: 'Review order',
    place_order: 'Process Payment',
    summary: 'Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    shipping_free: 'Free',
    shipping_pending: 'Calculated in next step',
    delivery: 'Home delivery',
    delivery_price: '$24.00',
    delivery_time: '1 to 3 business days',
    pickup: 'Store pickup',
    pickup_price: 'Free',
    pickup_time: 'Available in 24 hours',
    pickup_address: 'Av. Principal Las Mercedes, Local 4B',
    taxes: 'Taxes',
    total: 'Total',
    discount: 'Discount code',
    discount_apply: 'Apply',
    shipping_title: 'Shipping information',
    default_address: 'Default address',
    change_address: 'Change address',
    add_address: 'Add new address',
    cancel: 'Cancel',
    save_address: 'Save to my address book',
    country: 'Country',
    state: 'State / Province',
    first_name: 'First name',
    last_name: 'Last name',
    address1: 'Address line 1',
    address2: 'Address line 2 (optional)',
    city: 'City',
    zip: 'ZIP Code',
    recipient_title: 'Recipient contact (optional)',
    recipient_name: 'Full name',
    recipient_id: 'ID / Passport',
    recipient_phone: 'Phone',
    method_title: 'Shipping method',
    delivery_desc: 'Get your order delivered to your doorstep.',
    payment_title: 'Payment information',
    billing_same: 'Same as shipping address',
    billing_title: 'Billing address',
    card_method: 'Credit / Debit card',
    card_processor: 'processed via PayPal',
    security_note: 'Your payment information is securely processed via PayPal. We do not store card data.',
    confirm_title: 'Confirm your order',
    confirm_order: 'Order',
    edit: 'Edit',
    no_recipient: 'Not provided',
    billing_same_as_shipping: 'Same as shipping',
    payment_method: 'Payment method',
    success_title: 'Order confirmed!',
    success_desc: 'You will receive a confirmation email.',
    download_receipt: 'Download receipt',
    continue_shopping: 'Continue shopping',
    secure_payment: '100% secure and encrypted payment',
    secure_paypal: 'Payment securely processed via PayPal',
  },
};

function t(lang: string, key: string): string {
  return T[lang]?.[key] ?? T.en[key] ?? key;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseMoney(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatAddress(addr: ShippingAddress): string {
  const parts = [addr.firstName, addr.lastName].filter(Boolean).join(' ');
  const line1 = addr.addressLine1 || '';
  const line2 = addr.addressLine2 || '';
  const cityState = [addr.city, addr.state].filter(Boolean).join(', ');
  const zip = addr.postalCode || '';
  return [parts, line1, line2, [cityState, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(10000 + Math.random() * 90000));
  return `#MF-${year}-${rand}`;
}

// ─── NextButton component ───────────────────────────────────────────────────

function NextButton({ label, onClick, loading }: { label: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      className="btn-primary ch-next-btn"
      onClick={onClick}
      disabled={loading}
    >
      {loading
        ? <span className="ch-btn-spinner" />
        : <><span className="material-symbols-outlined" style={{fontSize:'1.25rem'}}>arrow_forward</span>{label}</>
      }
    </button>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CheckoutClient({ lang, cartData: cartJson, userAddresses: addrJson }: Props) {
  const cartData: CheckoutCartData = JSON.parse(cartJson);
  const initialAddresses: UserAddress[] = JSON.parse(addrJson);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Step 1
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialAddresses.find(a => a.isDefault)?.id ?? initialAddresses[0]?.id ?? null,
  );
  const [showAddressList, setShowAddressList] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [shippingForm, setShippingForm] = useState<ShippingAddress>({
    firstName: '', lastName: '', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', countryCode: 'US',
  });
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [recipient, setRecipient] = useState<RecipientContact>({ fullName: '', idType: 'V-', idNumber: '', phone: '' });
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [states, setStates] = useState<Array<{ code: string; name: string }>>([]);
  const [shippingErrors, setShippingErrors] = useState<string | null>(null);

  // Step 2
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');

  // Step 3
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingForm, setBillingForm] = useState<ShippingAddress>({
    firstName: '', lastName: '', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', countryCode: 'US',
  });

  // Step 4
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Enriched cart data
  const [enrichedCart, setEnrichedCart] = useState<CheckoutCartData | null>(null);

  useEffect(() => {
    fetch('/api/cart/', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data?.items) {
          setEnrichedCart({
            orderId: cartData.orderId,
            totalPrice: data.totalPrice,
            items: data.items.map((i: any) => ({
              itemId: i.itemId, title: i.title, quantity: i.quantity,
              unitPrice: i.price, totalPrice: i.totalPrice,
              variationId: i.variationId, thumbnailUrl: i.thumbnailUrl,
              hasCard: i.hasCard, ribbonColor: i.ribbonColor,
            })),
          });
        }
      })
      .catch(() => {});
  }, []);

  const displayCart = enrichedCart ?? cartData;

  useEffect(() => {
    fetch('/api/address/countries')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCountries(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!shippingForm.countryCode) return;
    fetch(`/api/address/states?country=${shippingForm.countryCode}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setStates(data); })
      .catch(() => {});
  }, [shippingForm.countryCode]);

  const selectedAddress = selectedAddressId
    ? initialAddresses.find(a => a.id === selectedAddressId) ?? null
    : null;

  const shippingCost = shippingMethod === 'delivery' ? 24.00 : 0;
  const subtotalAmount = parseMoney(displayCart.totalPrice);
  const totalAmount = subtotalAmount + shippingCost;

  const handleNext = async () => {
    setShippingErrors(null);

    if (currentStep === 0) {
      if (selectedAddress) { setCurrentStep(1); return; }
      if (!shippingForm.firstName || !shippingForm.lastName || !shippingForm.addressLine1 || !shippingForm.city || !shippingForm.postalCode) {
        setShippingErrors(lang === 'es' ? 'Completa todos los campos obligatorios.' : 'Complete all required fields.');
        return;
      }
      if (saveNewAddress) {
        try {
          await fetch('/api/user/addresses/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              countryCode: shippingForm.countryCode,
              givenName: shippingForm.firstName,
              familyName: shippingForm.lastName,
              addressLine1: shippingForm.addressLine1,
              addressLine2: shippingForm.addressLine2 || undefined,
              locality: shippingForm.city,
              administrativeArea: shippingForm.state || undefined,
              postalCode: shippingForm.postalCode,
            }),
          });
        } catch { /* ignore */ }
      }
      setCurrentStep(1);
      return;
    }
    if (currentStep === 1) { setCurrentStep(2); return; }
    if (currentStep === 2) { setCurrentStep(3); setOrderNumber(generateOrderNumber()); return; }
  };

  const handlePlaceOrder = useCallback(async () => {
    setSubmitting(true);
    try {
      const address = selectedAddress
        ? {
            firstName: selectedAddress.firstName ?? '',
            lastName: selectedAddress.lastName ?? '',
            addressLine1: selectedAddress.addressLine1 ?? '',
            addressLine2: selectedAddress.addressLine2 ?? '',
            city: selectedAddress.city ?? '',
            state: selectedAddress.state ?? '',
            postalCode: selectedAddress.postalCode ?? '',
            countryCode: selectedAddress.countryCode ?? 'US',
          }
        : shippingForm;
      const billing = billingSameAsShipping ? address : billingForm;

      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cartData.items,
          shippingAddress: address,
          shippingMethod,
          billingAddress: billing,
          paymentMethod: 'paypal',
          recipientContact: recipient.fullName ? recipient : null,
          lang,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Order creation failed');

      const paypalRes = await fetch('/api/checkout/paypal-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderId,
          amount: totalAmount,
          currency: 'USD',
          returnUrl: `${window.location.origin}/${lang}/checkout/success?order=${data.orderNumber}&orderId=${data.orderId}`,
          cancelUrl: `${window.location.origin}/${lang}/checkout`,
        }),
      });
      const paypalData = await paypalRes.json();
      if (paypalData.approvalUrl) {
        window.location.href = paypalData.approvalUrl;
      } else {
        throw new Error('PayPal URL not received');
      }
    } catch (e: any) {
      setShippingErrors(e.message ?? 'Error processing payment');
      setSubmitting(false);
    }
  }, [selectedAddress, shippingForm, billingSameAsShipping, billingForm, shippingMethod, recipient, cartData, totalAmount, lang]);

  // ── CAMBIO 1: Stepper ─────────────────────────────────────────────────────

  function renderStepper() {
    const steps = [
      { label: STEP_LABELS[lang]?.shipping ?? 'Shipping', icon: 'local_shipping' },
      { label: STEP_LABELS[lang]?.method ?? 'Method',     icon: 'inventory_2'    },
      { label: STEP_LABELS[lang]?.payment ?? 'Payment',   icon: 'credit_card'    },
      { label: STEP_LABELS[lang]?.confirm ?? 'Confirm',   icon: 'check_circle'   },
    ];
    return (
      <nav className="ch-stepper">
        {steps.map((step, i) => {
          const isPast = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={i} className="ch-stepper-item">
              {i > 0 && <span className={`ch-step-line ${isPast || isCurrent ? 'ch-step-line--done' : ''}`} />}
              <button
                type="button"
                disabled={!isPast}
                onClick={() => isPast && setCurrentStep(i)}
                className={`ch-step-circle ${isPast ? 'ch-step-circle--done' : ''} ${isCurrent ? 'ch-step-circle--active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{fontSize:'1rem'}}>
                  {isPast ? 'check' : step.icon}
                </span>
              </button>
              <span className={`ch-step-label ${isCurrent ? 'ch-step-label--active' : ''} ${isPast ? 'ch-step-label--past' : ''}`}>
                {step.label}
              </span>
            </div>
          );
        })}
        <style>{`
          .ch-stepper { display: flex; align-items: flex-start; justify-content: center; gap: 0; margin-bottom: 2rem; position: relative; }
          .ch-stepper-item { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex: 1; position: relative; }
          .ch-step-line { position: absolute; top: 1.25rem; right: 50%; width: 100%; height: 2px; background: var(--border); transition: background 0.3s; z-index: 0; }
          .ch-step-line--done { background: var(--primary); }
          .ch-step-circle { position: relative; z-index: 1; width: 2.5rem; height: 2.5rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; background: var(--border); color: var(--muted); border: 2px solid var(--border); cursor: default; transition: all 0.2s; font-family: inherit; }
          .ch-step-circle--done { background: var(--primary); border-color: var(--primary); color: white; cursor: pointer; }
          .ch-step-circle--active { background: white; border-color: var(--primary); color: var(--primary); box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 12%, transparent); }
          .ch-step-circle:hover:not(:disabled) { box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 12%, transparent); }
          .ch-step-label { font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); text-align: center; line-height: 1.2; white-space: nowrap; }
          .ch-step-label--active { color: var(--primary); }
          .ch-step-label--past { color: var(--sage); }
          @media (max-width: 480px) { .ch-step-label { display: none; } }
        `}</style>
      </nav>
    );
  }

  // ── CAMBIO 6: Summary sidebar ─────────────────────────────────────────────

  function renderSummary() {
    return (
      <aside className="ch-summary">
        <h3 className="ch-summary-title">{t(lang, 'summary')}</h3>
        <div className="ch-summary-items">
          {displayCart.items.map(item => (
            <div key={item.itemId} className="ch-summary-item">
              <div className="ch-summary-item-img-wrap">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="ch-summary-item-img" />
                ) : (
                  <div className="ch-summary-item-placeholder">
                    <span className="material-symbols-outlined">local_florist</span>
                  </div>
                )}
                <span className="ch-summary-item-qty">{item.quantity}</span>
              </div>
              <div className="ch-summary-item-info">
                <p className="ch-summary-item-title">{item.title}</p>
                {item.hasCard && <p className="ch-summary-item-sub">{lang === 'es' ? 'Con tarjeta' : 'With card'}</p>}
                {item.ribbonColor && <p className="ch-summary-item-sub">{lang === 'es' ? 'Cinta' : 'Ribbon'}: {item.ribbonColor.name}</p>}
              </div>
              <span className="ch-summary-item-price">{item.totalPrice}</span>
            </div>
          ))}
        </div>
        <div className="ch-summary-discount">
          <input type="text" className="ch-discount-input" placeholder={t(lang, 'discount')} />
          <button type="button" className="ch-discount-btn">{t(lang, 'discount_apply')}</button>
        </div>
        <div className="ch-summary-totals">
          <div className="ch-total-row"><span>{t(lang, 'subtotal')}</span><span>{displayCart.totalPrice}</span></div>
          <div className="ch-total-row">
            <span>{t(lang, 'shipping')}</span>
            <span>{currentStep < 1 ? t(lang, 'shipping_pending') : shippingCost === 0 ? t(lang, 'shipping_free') : formatMoney(shippingCost)}</span>
          </div>
          <div className="ch-total-row"><span>{t(lang, 'taxes')}</span><span>$0.00</span></div>
          <hr className="ch-divider" />
          <div className="ch-total-row ch-total-final"><span>{t(lang, 'total')}</span><span>{formatMoney(totalAmount)}</span></div>
        </div>
        <style>{`
          .ch-summary { background: white; border: 1.5px solid var(--border); border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 20px rgba(109,81,87,0.06); }
          .ch-summary-title { font-size: 1rem; font-weight: 800; color: var(--headline); font-family: var(--font-heading); margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); }
          .ch-summary-items { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; max-height: 300px; overflow-y: auto; }
          .ch-summary-item { display: flex; gap: 0.75rem; align-items: flex-start; }
          .ch-summary-item-img-wrap { position: relative; width: 3.75rem; height: 3.75rem; border-radius: 0.625rem; overflow: hidden; background: var(--blush); flex-shrink: 0; border: 1px solid var(--border); }
          .ch-summary-item-img { width: 100%; height: 100%; object-fit: cover; }
          .ch-summary-item-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 1.25rem; }
          .ch-summary-item-qty { position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; font-size: 0.6875rem; font-weight: 700; width: 1.125rem; height: 1.125rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }
          .ch-summary-item-info { flex: 1; min-width: 0; }
          .ch-summary-item-title { font-size: 0.8125rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .ch-summary-item-sub { font-size: 0.6875rem; color: var(--text-muted); }
          .ch-summary-item-price { font-size: 0.8125rem; font-weight: 600; white-space: nowrap; }
          .ch-summary-discount { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
          .ch-discount-input { flex: 1; height: 2.5rem; border: 1.5px solid var(--border); border-radius: 0.5rem; padding: 0 0.875rem; font-size: 0.8125rem; outline: none; font-family: inherit; transition: border-color 0.15s; }
          .ch-discount-input:focus { border-color: var(--primary); }
          .ch-discount-btn { height: 2.5rem; padding: 0 1rem; background: var(--headline); color: white; border: none; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.15s; }
          .ch-discount-btn:hover { background: var(--primary); }
          .ch-summary-totals { display: flex; flex-direction: column; gap: 0.5rem; }
          .ch-total-row { display: flex; justify-content: space-between; font-size: 0.875rem; }
          .ch-total-final { font-size: 1.25rem; font-weight: 800; padding-top: 0.5rem; }
          .ch-total-final span:last-child { color: var(--primary); }
          .ch-divider { border: none; border-top: 1px solid var(--border); margin: 0.25rem 0; }
        `}</style>
      </aside>
    );
  }

  // ── CAMBIO 3: Step Shipping ───────────────────────────────────────────────

  function renderStepShipping() {
    const hasAddresses = initialAddresses.length > 0;
    return (
      <section>
        <h2 className="ch-step-title">{t(lang, 'shipping_title')}</h2>
        {shippingErrors && <div className="ch-error">{shippingErrors}</div>}

        {hasAddresses && !showNewAddressForm && (
          <div className="ch-address-section">
            {selectedAddress && !showAddressList ? (
              <div className="ch-address-card ch-address-card-selected" onClick={() => setShowAddressList(true)}>
                <div className="ch-address-card-body">
                  <p className="ch-address-name">{selectedAddress.firstName} {selectedAddress.lastName}</p>
                  <p className="ch-address-line">{selectedAddress.addressLine1}</p>
                  {selectedAddress.addressLine2 && <p className="ch-address-line">{selectedAddress.addressLine2}</p>}
                  <p className="ch-address-line">{[selectedAddress.city, selectedAddress.state, selectedAddress.postalCode].filter(Boolean).join(', ')}</p>
                </div>
                <button type="button" className="ch-edit-btn" onClick={e => { e.stopPropagation(); setShowAddressList(true); }}>
                  {t(lang, 'change_address')}
                </button>
              </div>
            ) : (
              <div className="ch-address-list">
                {initialAddresses.map(addr => (
                  <button key={addr.id} type="button"
                    className={`ch-address-card ${addr.id === selectedAddressId ? 'ch-address-card-selected' : ''}`}
                    onClick={() => { setSelectedAddressId(addr.id); setShowAddressList(false); }}
                  >
                    <div className="ch-address-card-body">
                      <p className="ch-address-name">{addr.firstName} {addr.lastName}</p>
                      <p className="ch-address-line">{addr.addressLine1}</p>
                      <p className="ch-address-line">{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}</p>
                    </div>
                    {addr.isDefault && <span className="ch-badge">{t(lang, 'default_address')}</span>}
                  </button>
                ))}
                <button type="button" className="ch-add-btn" onClick={() => { setShowNewAddressForm(true); setShowAddressList(false); }}>
                  + {t(lang, 'add_address')}
                </button>
              </div>
            )}
          </div>
        )}

        {(showNewAddressForm || !hasAddresses) && (
          <div className="ch-address-form">
            <div className="ch-form-row">
              <div className="ch-field">
                <label className="field-label">{t(lang, 'first_name')} *</label>
                <div className="field-inner">
                  <input type="text" className="field-input" value={shippingForm.firstName}
                    onChange={e => setShippingForm(f => ({...f, firstName: e.target.value}))} required />
                </div>
              </div>
              <div className="ch-field">
                <label className="field-label">{t(lang, 'last_name')} *</label>
                <div className="field-inner">
                  <input type="text" className="field-input" value={shippingForm.lastName}
                    onChange={e => setShippingForm(f => ({...f, lastName: e.target.value}))} required />
                </div>
              </div>
            </div>
            <div className="ch-form-row">
              <div className="ch-field">
                <label className="field-label">{t(lang, 'country')} *</label>
                <div className="field-inner">
                  <select className="field-input" value={shippingForm.countryCode}
                    onChange={e => setShippingForm(f => ({...f, countryCode: e.target.value, state: ''}))}>
                    {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="ch-field">
                <label className="field-label">{t(lang, 'state')}</label>
                <div className="field-inner">
                  <select className="field-input" value={shippingForm.state || ''}
                    onChange={e => setShippingForm(f => ({...f, state: e.target.value}))}>
                    <option value="">{lang === 'es' ? 'Seleccionar...' : 'Select...'}</option>
                    {states.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="ch-field">
              <label className="field-label">{t(lang, 'address1')} *</label>
              <div className="field-inner">
                <input type="text" className="field-input" value={shippingForm.addressLine1}
                  onChange={e => setShippingForm(f => ({...f, addressLine1: e.target.value}))} required />
              </div>
            </div>
            <div className="ch-field">
              <label className="field-label">{t(lang, 'address2')}</label>
              <div className="field-inner">
                <input type="text" className="field-input" value={shippingForm.addressLine2}
                  onChange={e => setShippingForm(f => ({...f, addressLine2: e.target.value}))} />
              </div>
            </div>
            <div className="ch-form-row">
              <div className="ch-field">
                <label className="field-label">{t(lang, 'city')} *</label>
                <div className="field-inner">
                  <input type="text" className="field-input" value={shippingForm.city}
                    onChange={e => setShippingForm(f => ({...f, city: e.target.value}))} required />
                </div>
              </div>
              <div className="ch-field">
                <label className="field-label">{t(lang, 'zip')} *</label>
                <div className="field-inner">
                  <input type="text" className="field-input" value={shippingForm.postalCode}
                    onChange={e => setShippingForm(f => ({...f, postalCode: e.target.value}))} required />
                </div>
              </div>
            </div>
            {hasAddresses && (
              <label className="ch-checkbox-label">
                <input type="checkbox" checked={saveNewAddress} onChange={e => setSaveNewAddress(e.target.checked)} className="ch-checkbox" />
                {t(lang, 'save_address')}
              </label>
            )}
            {hasAddresses && (
              <button type="button" className="ch-link-btn" onClick={() => { setShowNewAddressForm(false); setShowAddressList(true); }}>
                {t(lang, 'cancel')}
              </button>
            )}
          </div>
        )}

        <details className="ch-recipient-section">
          <summary className="ch-recipient-summary">{t(lang, 'recipient_title')}</summary>
          <div className="ch-recipient-form">
            <div className="ch-field">
              <label className="field-label">{t(lang, 'recipient_name')}</label>
              <div className="field-inner">
                <input type="text" className="field-input" value={recipient.fullName}
                  onChange={e => setRecipient(r => ({...r, fullName: e.target.value}))} />
              </div>
            </div>
            <div className="ch-form-row">
              <div className="ch-field ch-field-small">
                <label className="field-label">{t(lang, 'recipient_id')}</label>
                <div className="field-inner">
                  <div className="ch-id-prefix">
                    <select value={recipient.idType} onChange={e => setRecipient(r => ({...r, idType: e.target.value}))} className="ch-id-select">
                      <option value="V-">V-</option>
                      <option value="E-">E-</option>
                      <option value="P-">P-</option>
                    </select>
                    <input type="text" className="ch-id-input" value={recipient.idNumber}
                      onChange={e => setRecipient(r => ({...r, idNumber: e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="ch-field">
                <label className="field-label">{t(lang, 'recipient_phone')}</label>
                <div className="field-inner">
                  <input type="tel" className="field-input" value={recipient.phone}
                    onChange={e => setRecipient(r => ({...r, phone: e.target.value}))} />
                </div>
              </div>
            </div>
          </div>
        </details>

        <NextButton label={t(lang, 'next')} onClick={handleNext} />
      </section>
    );
  }

  // ── CAMBIO 4 + 10: Step Method ────────────────────────────────────────────

  function renderStepMethod() {
    const address = selectedAddress ?? shippingForm;
    return (
      <section>
        <h2 className="ch-step-title">{t(lang, 'method_title')}</h2>

        <div className="ch-address-bar">
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', flex:1, minWidth:0}}>
            <span className="material-symbols-outlined" style={{fontSize:'1rem', color:'var(--primary)', flexShrink:0}}>location_on</span>
            <span className="ch-address-bar-text">{formatAddress(address as ShippingAddress)}</span>
          </div>
          <button type="button" className="ch-edit-btn" onClick={() => setCurrentStep(0)}>{t(lang, 'edit')}</button>
        </div>

        <div className="ch-method-list">
          <label className={`ch-method-card ${shippingMethod === 'delivery' ? 'ch-method-selected' : ''}`}>
            <input type="radio" name="shipping" value="delivery" checked={shippingMethod === 'delivery'}
              onChange={() => setShippingMethod('delivery')} className="ch-radio" />
            <span className="material-symbols-outlined ch-method-icon" style={{color: shippingMethod==='delivery' ? 'var(--primary)' : 'var(--muted)', fontSize:'1.75rem'}}>local_shipping</span>
            <div className="ch-method-body">
              <p className="ch-method-title">{t(lang, 'delivery')}</p>
              <p className="ch-method-desc">{t(lang, 'delivery_time')}</p>
            </div>
            <p className="ch-method-price">{t(lang, 'delivery_price')}</p>
          </label>
          <label className={`ch-method-card ${shippingMethod === 'pickup' ? 'ch-method-selected' : ''}`}>
            <input type="radio" name="shipping" value="pickup" checked={shippingMethod === 'pickup'}
              onChange={() => setShippingMethod('pickup')} className="ch-radio" />
            <span className="material-symbols-outlined ch-method-icon" style={{color: shippingMethod==='pickup' ? 'var(--primary)' : 'var(--muted)', fontSize:'1.75rem'}}>store</span>
            <div className="ch-method-body">
              <p className="ch-method-title">{t(lang, 'pickup')}</p>
              <p className="ch-method-desc">{t(lang, 'pickup_time')}<br />{t(lang, 'pickup_address')}</p>
            </div>
            <p className="ch-method-price">{t(lang, 'pickup_price')}</p>
          </label>
        </div>

        <NextButton label={t(lang, 'next_payment')} onClick={handleNext} />
      </section>
    );
  }

  // ── CAMBIO 5: Step Payment ────────────────────────────────────────────────

  function renderStepPayment() {
    return (
      <section>
        <h2 className="ch-step-title">{t(lang, 'payment_title')}</h2>

        <div className="ch-security-banner">
          <span className="material-symbols-outlined" style={{color:'var(--sage)', fontSize:'1.25rem'}}>verified_user</span>
          <span>{t(lang, 'secure_payment')}</span>
          <span className="material-symbols-outlined" style={{color:'var(--sage)', fontSize:'1.25rem'}}>lock</span>
        </div>

        <div className="ch-section-card">
          <h3 className="ch-section-title">{t(lang, 'billing_title')}</h3>
          <label className="ch-checkbox-label">
            <input type="checkbox" checked={billingSameAsShipping} onChange={e => setBillingSameAsShipping(e.target.checked)} className="ch-checkbox" />
            {t(lang, 'billing_same')}
          </label>
          {!billingSameAsShipping && (
            <div className="ch-address-form ch-mt">
              <div className="ch-form-row">
                <div className="ch-field"><label className="field-label">{t(lang, 'first_name')} *</label><div className="field-inner"><input type="text" className="field-input" value={billingForm.firstName} onChange={e => setBillingForm(f => ({...f, firstName: e.target.value}))} /></div></div>
                <div className="ch-field"><label className="field-label">{t(lang, 'last_name')} *</label><div className="field-inner"><input type="text" className="field-input" value={billingForm.lastName} onChange={e => setBillingForm(f => ({...f, lastName: e.target.value}))} /></div></div>
              </div>
              <div className="ch-field"><label className="field-label">{t(lang, 'country')} *</label><div className="field-inner"><select className="field-input" value={billingForm.countryCode} onChange={e => setBillingForm(f => ({...f, countryCode: e.target.value, state: ''}))}>{countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div></div>
              <div className="ch-field"><label className="field-label">{t(lang, 'address1')} *</label><div className="field-inner"><input type="text" className="field-input" value={billingForm.addressLine1} onChange={e => setBillingForm(f => ({...f, addressLine1: e.target.value}))} /></div></div>
              <div className="ch-form-row">
                <div className="ch-field"><label className="field-label">{t(lang, 'city')} *</label><div className="field-inner"><input type="text" className="field-input" value={billingForm.city} onChange={e => setBillingForm(f => ({...f, city: e.target.value}))} /></div></div>
                <div className="ch-field"><label className="field-label">{t(lang, 'zip')} *</label><div className="field-inner"><input type="text" className="field-input" value={billingForm.postalCode} onChange={e => setBillingForm(f => ({...f, postalCode: e.target.value}))} /></div></div>
              </div>
            </div>
          )}
        </div>

        <div className="ch-section-card">
          <h3 className="ch-section-title">{t(lang, 'payment_method')}</h3>
          <div className="ch-payment-option">
            <div className="ch-payment-radio"><span className="ch-radio-dot" /></div>
            <div className="ch-payment-info">
              <p className="ch-payment-name">{t(lang, 'card_method')}<span className="ch-payment-processor"> — {t(lang, 'card_processor')}</span></p>
              <div className="ch-payment-logos">
                <img src="https://cdn.jsdelivr.net/gh/maggyflowers/maggy-assets/icons/visa.svg" alt="VISA" className="ch-card-logo" />
                <img src="https://cdn.jsdelivr.net/gh/maggyflowers/maggy-assets/icons/mastercard.svg" alt="MC" className="ch-card-logo" />
              </div>
            </div>
          </div>
          <div className="ch-security-note">
            <span className="material-symbols-outlined ch-security-icon">lock</span>
            <span>{t(lang, 'security_note')}</span>
          </div>
        </div>

        <NextButton label={t(lang, 'next_confirm')} onClick={handleNext} />
      </section>
    );
  }

  // ── CAMBIO 9: Step Confirm ────────────────────────────────────────────────

  function renderStepConfirm() {
    const address = selectedAddress ?? shippingForm;
    return (
      <section>
        <h2 className="ch-step-title">
          <span className="material-symbols-outlined" style={{verticalAlign:'middle', marginRight:'0.5rem', color:'var(--primary)'}}>checklist</span>
          {t(lang, 'confirm_title')}
        </h2>
        <div className="ch-confirm-grid">
          <div className="ch-confirm-card">
            <div className="ch-confirm-card-header"><h4>{t(lang, 'shipping_title')}</h4><button type="button" className="ch-edit-btn" onClick={() => setCurrentStep(0)}>{t(lang, 'edit')}</button></div>
            <p className="ch-confirm-method">{t(lang, shippingMethod === 'delivery' ? 'delivery' : 'pickup')}</p>
            <p className="ch-confirm-addr">{formatAddress(address as ShippingAddress)}</p>
            <p className="ch-confirm-time">{t(lang, shippingMethod === 'delivery' ? 'delivery_time' : 'pickup_time')}</p>
          </div>
          <div className="ch-confirm-card">
            <div className="ch-confirm-card-header"><h4>{t(lang, 'recipient_title')}</h4></div>
            {recipient.fullName ? (
              <><p className="ch-confirm-addr">{recipient.fullName}</p><p className="ch-confirm-addr">{recipient.idType}{recipient.idNumber}</p>{recipient.phone && <p className="ch-confirm-addr">{recipient.phone}</p>}</>
            ) : <p className="ch-confirm-empty">{t(lang, 'no_recipient')}</p>}
          </div>
          <div className="ch-confirm-card">
            <div className="ch-confirm-card-header"><h4>{t(lang, 'billing_title')}</h4><button type="button" className="ch-edit-btn" onClick={() => setCurrentStep(2)}>{t(lang, 'edit')}</button></div>
            {billingSameAsShipping ? <p className="ch-confirm-addr">{t(lang, 'billing_same_as_shipping')}</p> : <p className="ch-confirm-addr">{formatAddress(billingForm)}</p>}
          </div>
          <div className="ch-confirm-card">
            <div className="ch-confirm-card-header"><h4>{t(lang, 'payment_method')}</h4><button type="button" className="ch-edit-btn" onClick={() => setCurrentStep(2)}>{t(lang, 'edit')}</button></div>
            <p className="ch-confirm-addr">{t(lang, 'card_method')} ({t(lang, 'card_processor')})</p>
          </div>
        </div>
        {shippingErrors && <div className="ch-error">{shippingErrors}</div>}
        <button
          type="button"
          className="btn-primary ch-next-btn"
          onClick={handlePlaceOrder}
          disabled={submitting}
          style={{height:'3.5rem', fontSize:'1.0625rem', fontWeight:800, borderRadius:'0.875rem', marginTop:'0.5rem', boxShadow:'0 6px 24px color-mix(in srgb, var(--primary) 35%, transparent)'}}
        >
          {submitting ? <span className="ch-btn-spinner" /> : <><span className="material-symbols-outlined" style={{fontSize:'1.25rem'}}>payments</span>{`${t(lang, 'place_order')} — ${formatMoney(totalAmount)}`}</>}
        </button>
        <p style={{textAlign:'center', fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem'}}>
          <span className="material-symbols-outlined" style={{fontSize:'0.875rem'}}>lock</span>
          {t(lang, 'secure_paypal')}
        </p>
      </section>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <div className="ch-page">
      <div className="ch-container">
        {renderStepper()}

        {/* Mobile summary toggle (only visible on mobile) */}
        <div className="ch-mobile-summary">
          <button type="button" className="ch-mobile-summary-toggle" onClick={() => setMobileSummaryOpen(v => !v)}>
            <span style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <span className="material-symbols-outlined" style={{fontSize:'1.125rem'}}>shopping_bag</span>
              {t(lang, 'summary')}
              <span className="material-symbols-outlined" style={{fontSize:'1rem', transition:'transform 0.2s', transform: mobileSummaryOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>expand_more</span>
            </span>
            <span className="ch-mobile-total">{formatMoney(totalAmount)}</span>
          </button>
          {mobileSummaryOpen && <div className="ch-mobile-summary-body">{renderSummary()}</div>}
        </div>

        {/* Step content */}
        <div className="ch-step-body" key={currentStep}>
          {currentStep === 0 && renderStepShipping()}
          {currentStep === 1 && renderStepMethod()}
          {currentStep === 2 && renderStepPayment()}
          {currentStep === 3 && renderStepConfirm()}
        </div>

        {/* Desktop summary (always visible below form) */}
        <div className="ch-desktop-summary">
          {renderSummary()}
        </div>
      </div>

      <style>{`
        .ch-page { width: 100%; padding: 2rem 0; display: flex; justify-content: center; }
        .ch-container { width: 100%; max-width: 46rem; margin: 0; padding: 0 1rem; }
        .ch-step-body { animation: ch-step-in 0.22s ease-out both; }

        .ch-step-body { animation: ch-step-in 0.22s ease-out both; }
        @keyframes ch-step-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }

        /* Mobile summary: only on screens < 1024px */
        .ch-mobile-summary { display: block; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; }
        @media (min-width: 1024px) { .ch-mobile-summary { display: none; } }
        .ch-mobile-summary-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; background: none; border: none; cursor: pointer; font-family: inherit; font-size: 0.9375rem; font-weight: 700; color: var(--primary); }
        .ch-mobile-total { font-size: 1.125rem; font-weight: 800; color: var(--headline); }
        .ch-mobile-summary-body { padding-bottom: 1rem; }

        /* Desktop summary: only on screens >= 1024px */
        .ch-desktop-summary { display: none; }
        @media (min-width: 1024px) { .ch-desktop-summary { display: block; margin-top: 2rem; } }

        /* Global styles */
        .ch-step-title { font-size: 1.25rem; font-weight: 800; color: var(--headline); margin-bottom: 1.5rem; font-family: var(--font-heading); }
        .ch-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; margin-bottom: 1rem; }
        .ch-next-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; width: 100%; height: 3.25rem; font-size: 1rem; font-weight: 800; border-radius: 0.75rem; box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent); }
        .ch-btn-spinner { width: 1.125rem; height: 1.125rem; border: 2.5px solid rgba(255 255 255 / 0.35); border-top-color: white; border-radius: 50%; animation: ch-spin 0.7s linear infinite; display: inline-block; }
        @keyframes ch-spin { to { transform: rotate(360deg); } }
        .ch-edit-btn { background: none; border: none; color: var(--primary); font-weight: 600; font-size: 0.8125rem; cursor: pointer; padding: 0; white-space: nowrap; }
        .ch-edit-btn:hover { text-decoration: underline; }
        .field-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem; display: block; }
        .field-inner { position: relative; }
        .field-input { width: 100%; height: 2.75rem; border: 1.5px solid var(--border); border-radius: 0.5rem; padding: 0 0.875rem; font-family: inherit; font-size: 0.875rem; color: var(--headline); background: white; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .field-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent); }

        /* CAMBIO 3: Address cards */
        .ch-address-section { margin-bottom: 1.25rem; }
        .ch-address-card { border: 2px solid var(--border); border-radius: 0.875rem; padding: 1rem 1.25rem; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; text-align: left; background: white; width: 100%; font-family: inherit; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .ch-address-card:hover { border-color: var(--primary); box-shadow: 0 2px 12px color-mix(in srgb, var(--primary) 8%, transparent); }
        .ch-address-card-selected { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 4%, transparent); box-shadow: 0 2px 12px color-mix(in srgb, var(--primary) 10%, transparent); }
        .ch-address-card::before { content: ''; width: 1.125rem; height: 1.125rem; border-radius: 9999px; border: 2px solid var(--border); flex-shrink: 0; transition: border-color 0.15s, background 0.15s; }
        .ch-address-card-selected::before { border-color: var(--primary); background: radial-gradient(circle, var(--primary) 40%, transparent 42%); border-width: 2px; }
        .ch-address-card-body { flex: 1; min-width: 0; }
        .ch-address-name { font-weight: 600; font-size: 0.9375rem; color: var(--headline); }
        .ch-address-line { font-size: 0.8125rem; color: var(--text-muted); }
        .ch-address-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .ch-add-btn { background: none; border: 1px dashed var(--border); border-radius: 0.75rem; padding: 0.75rem; color: var(--primary); font-weight: 600; font-size: 0.875rem; cursor: pointer; width: 100%; text-align: center; font-family: inherit; }
        .ch-add-btn:hover { border-color: var(--primary); }
        .ch-badge { display: inline-block; background: var(--sage-light); color: var(--sage); font-size: 0.6875rem; font-weight: 600; padding: 0.125rem 0.5rem; border-radius: 9999px; margin-top: 0.25rem; }
        .ch-address-form { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
        .ch-form-row { display: flex; gap: 0.75rem; }
        .ch-form-row > .ch-field { flex: 1; }
        .ch-field-small { flex: 0 0 60% !important; }
        .ch-checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; cursor: pointer; color: var(--text-muted); }
        .ch-checkbox { width: 1rem; height: 1rem; accent-color: var(--primary); }
        .ch-link-btn { background: none; border: none; color: var(--text-muted); font-size: 0.8125rem; cursor: pointer; padding: 0; text-decoration: underline; font-family: inherit; }
        .ch-link-btn:hover { color: var(--primary); }
        .ch-recipient-section { margin: 1rem 0; border: 1.5px solid var(--border); border-radius: 0.875rem; padding: 0.875rem 1.125rem; }
        .ch-recipient-summary { font-weight: 700; font-size: 0.9375rem; cursor: pointer; color: var(--headline); }
        .ch-recipient-form { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.75rem; }
        .ch-id-prefix { display: flex; border: 1px solid var(--border); border-radius: 0.5rem; overflow: hidden; }
        .ch-id-prefix:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent); }
        .ch-id-select { width: 4rem; border: none; border-right: 1px solid var(--border); background: transparent; font-size: 0.875rem; outline: none; padding: 0 0.25rem; height: 2.5rem; }
        .ch-id-input { flex: 1; border: none; outline: none; font-size: 0.875rem; padding: 0 0.5rem; height: 2.5rem; }

        /* CAMBIO 10: Address bar */
        .ch-address-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: var(--blush); padding: 0.875rem 1rem; border-radius: 0.75rem; margin-bottom: 1.5rem; font-size: 0.8125rem; border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent); }
        .ch-address-bar-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* CAMBIO 4: Method cards */
        .ch-method-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .ch-method-card { display: flex; align-items: center; gap: 1rem; border: 2px solid var(--border); border-radius: 0.875rem; padding: 1.125rem; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; }
        .ch-method-card:hover { border-color: var(--primary); box-shadow: 0 2px 12px color-mix(in srgb, var(--primary) 8%, transparent); }
        .ch-method-selected { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 4%, transparent); box-shadow: 0 2px 12px color-mix(in srgb, var(--primary) 10%, transparent); }
        .ch-method-icon { flex-shrink: 0; transition: color 0.15s; }
        .ch-method-body { flex: 1; }
        .ch-method-title { font-weight: 700; font-size: 0.9375rem; color: var(--headline); }
        .ch-method-desc { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.125rem; }
        .ch-method-price { font-weight: 800; font-size: 1.0625rem; color: var(--primary); white-space: nowrap; }
        .ch-radio { display: none; }

        /* CAMBIO 5: Payment */
        .ch-security-banner { display: flex; align-items: center; justify-content: center; gap: 0.625rem; background: var(--sage-light); color: var(--sage); padding: 0.625rem 1rem; border-radius: 0.625rem; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1.25rem; }
        .ch-section-card { border: 1.5px solid var(--border); border-radius: 0.875rem; padding: 1.125rem; margin-bottom: 1rem; }
        .ch-section-title { font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 0.75rem; }
        .ch-mt { margin-top: 0.75rem; }
        .ch-payment-option { display: flex; align-items: center; gap: 0.875rem; padding: 1rem; border: 1.5px solid var(--primary); border-radius: 0.75rem; background: color-mix(in srgb, var(--primary) 4%, transparent); margin-bottom: 1rem; }
        .ch-payment-radio { width: 1.25rem; height: 1.25rem; border: 2px solid var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ch-radio-dot { width: 0.625rem; height: 0.625rem; background: var(--primary); border-radius: 50%; }
        .ch-payment-info { flex: 1; }
        .ch-payment-name { font-size: 0.875rem; font-weight: 600; }
        .ch-payment-processor { font-weight: 400; color: var(--text-muted); }
        .ch-payment-logos { display: flex; gap: 0.5rem; margin-top: 0.375rem; }
        .ch-card-logo { height: 1.25rem; }
        .ch-security-note { display: flex; align-items: flex-start; gap: 0.5rem; background: #eff6ff; color: #1e40af; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; line-height: 1.4; }
        .ch-security-icon { font-size: 1.125rem; flex-shrink: 0; margin-top: 0.0625rem; }

        /* CAMBIO 9: Confirm grid */
        .ch-confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem; }
        @media (max-width: 640px) { .ch-confirm-grid { grid-template-columns: 1fr; } }
        .ch-confirm-card { border: 1.5px solid var(--border); border-radius: 0.875rem; padding: 1.125rem; background: white; }
        .ch-confirm-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .ch-confirm-card-header h4 { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 0; }
        .ch-confirm-method { font-weight: 600; font-size: 0.9375rem; color: var(--primary); }
        .ch-confirm-addr { font-size: 0.8125rem; color: var(--text-muted); }
        .ch-confirm-time { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
        .ch-confirm-empty { font-size: 0.8125rem; font-style: italic; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
