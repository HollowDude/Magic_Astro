import { useState, useEffect, useCallback } from 'react';

interface Address {
  id: string;
  internalId: number | null;
  bundle: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
  phone: string | null;
  isDefault: boolean;
}

interface AddressFormData {
  countryCode: string;
  givenName: string;
  familyName: string;
  addressLine1: string;
  addressLine2: string;
  locality: string;
  administrativeArea: string;
  postalCode: string;
  label: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormData = {
  countryCode: 'US',
  givenName: '',
  familyName: '',
  addressLine1: '',
  addressLine2: '',
  locality: '',
  administrativeArea: '',
  postalCode: '',
  label: '',
  isDefault: false,
};

interface CountryOption {
  code: string;
  name: string;
}

interface StateOption {
  code: string;
  name: string;
}

interface Props {
  lang: 'es' | 'en';
}

const T = {
  es: {
    title: 'Libreta de Direcciones',
    add: 'Añadir dirección',
    edit: 'Editar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando...',
    loading: 'Cargando direcciones...',
    noAddresses: 'No tienes direcciones guardadas.',
    noAddressesHint: 'Agrega una dirección para agilizar tus compras.',
    errorLoad: 'No se pudieron cargar las direcciones.',
    errorSave: 'Error al guardar la dirección.',
    errorDelete: 'Error al eliminar la dirección.',
    defaultBadge: 'Predeterminada',
    name: 'Nombre',
    lastName: 'Apellido',
    addressLine1: 'Dirección línea 1',
    addressLine2: 'Dirección línea 2',
    city: 'Ciudad',
    state: 'Estado / Provincia',
    postalCode: 'Código Postal',
    country: 'País',
    label: 'Etiqueta (opcional)',
    labelHint: 'Ej: Casa, Trabajo',
    isDefault: 'Dirección predeterminada',
    phone: 'Teléfono (opcional)',
    addTitle: 'Nueva dirección',
    editTitle: 'Editar dirección',
    confirmDelete: '¿Eliminar esta dirección?',
    successSaved: 'Dirección guardada correctamente.',
    successDeleted: 'Dirección eliminada.',
    retry: 'Reintentar',
    close: 'Cerrar',
  },
  en: {
    title: 'Address Book',
    add: 'Add address',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    loading: 'Loading addresses...',
    noAddresses: 'No addresses saved yet.',
    noAddressesHint: 'Add an address to speed up your checkout.',
    errorLoad: 'Could not load addresses.',
    errorSave: 'Error saving address.',
    errorDelete: 'Error deleting address.',
    defaultBadge: 'Default',
    name: 'First Name',
    lastName: 'Last Name',
    addressLine1: 'Address Line 1',
    addressLine2: 'Address Line 2',
    city: 'City',
    state: 'State / Province',
    postalCode: 'ZIP Code',
    country: 'Country',
    label: 'Label (optional)',
    labelHint: 'E.g.: Home, Work',
    isDefault: 'Default address',
    phone: 'Phone (optional)',
    addTitle: 'New Address',
    editTitle: 'Edit Address',
    confirmDelete: 'Delete this address?',
    successSaved: 'Address saved successfully.',
    successDeleted: 'Address deleted.',
    retry: 'Retry',
    close: 'Close',
  },
};

export default function AddressManager({ lang }: Props) {
  const t = T[lang];
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/addresses?lang=${lang}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAddresses(data);
    } catch {
      setError(t.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [lang, t.errorLoad]);

  const fetchCountries = useCallback(async () => {
    setCountriesLoading(true);
    try {
      const res = await fetch('/api/address/countries');
      if (!res.ok) throw new Error('Failed to fetch countries');
      const data = await res.json();
      setCountries(data);
    } catch {
      setCountries([
        { code: 'US', name: 'United States' },
        { code: 'CU', name: 'Cuba' },
        { code: 'MX', name: 'Mexico' },
        { code: 'ES', name: 'Spain' },
        { code: 'CO', name: 'Colombia' },
        { code: 'PR', name: 'Puerto Rico' },
        { code: 'DO', name: 'Dominican Republic' },
      ]);
    } finally {
      setCountriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
    fetchCountries();
  }, [fetchAddresses, fetchCountries]);

  useEffect(() => {
    if (formData.countryCode) {
      setStatesLoading(true);
      fetch(`/api/address/states?country=${formData.countryCode}`)
        .then(r => r.json())
        .then(data => {
          setStates(Array.isArray(data) ? data : []);
        })
        .catch(() => setStates([]))
        .finally(() => setStatesLoading(false));
    } else {
      setStates([]);
    }
  }, [formData.countryCode]);

  const openAddForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setSaveError(null);
    setFieldErrors({});
    setCountrySearch('');
    setShowForm(true);
  };

  const openEditForm = (addr: Address) => {
    setFormData({
      countryCode: addr.countryCode || 'US',
      givenName: addr.firstName || '',
      familyName: addr.lastName || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      locality: addr.city || '',
      administrativeArea: addr.state || '',
      postalCode: addr.postalCode || '',
      label: addr.label || '',
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setSaveError(null);
    setFieldErrors({});
    setCountrySearch('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSaveError(null);
    setFieldErrors({});
    setCountrySearch('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'countryCode') {
        next.administrativeArea = '';
        next.postalCode = '';
      }
      return next;
    });
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.countryCode) errors.countryCode = lang === 'es' ? 'Selecciona un país' : 'Select a country';
    if (!formData.addressLine1.trim()) errors.addressLine1 = lang === 'es' ? 'La dirección es requerida' : 'Address is required';
    if (!formData.locality.trim()) errors.locality = lang === 'es' ? 'La ciudad es requerida' : 'City is required';
    if (formData.countryCode === 'US') {
      if (!formData.administrativeArea.trim()) {
        errors.administrativeArea = lang === 'es' ? 'El estado es requerido para Estados Unidos' : 'State is required for US addresses';
      }
      if (!formData.postalCode.trim()) {
        errors.postalCode = lang === 'es' ? 'El código postal es requerido para Estados Unidos' : 'ZIP code is required for US addresses';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    setSuccessMsg(null);

    try {
      const isEdit = !!editingId;
      const endpoint = isEdit ? '/api/user/addresses/update' : '/api/user/addresses/create';
      const body = isEdit
        ? { id: editingId, lang, ...formData }
        : { lang, ...formData };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.ok) {
        // If server returned a specific field error, show it inline
        if (data.field) {
          setFieldErrors(prev => ({ ...prev, [data.field]: data.error }));
        }
        throw new Error(data.error || t.errorSave);
      }

      setSuccessMsg(t.successSaved);
      closeForm();
      fetchAddresses();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.errorSave);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    setError(null);
    try {
      const res = await fetch('/api/user/addresses/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, lang }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || t.errorDelete);
      setSuccessMsg(t.successDeleted);
      fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorDelete);
    }
  };

  const dismissSuccess = () => setSuccessMsg(null);

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="font-heading text-2xl text-headline font-semibold">{t.title}</h1>
        {!loading && (
          <button onClick={openAddForm} class="btn-primary text-sm !h-10 !px-4">
            <span class="material-symbols-outlined text-[18px] leading-none">add</span>
            {t.add}
          </button>
        )}
      </div>

      {successMsg && (
        <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span class="text-sm font-medium">{successMsg}</span>
          <button onClick={dismissSuccess} class="text-emerald-500 hover:text-emerald-700">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {error && (
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center justify-between">
          <span class="text-sm font-medium">{error}</span>
          <button onClick={fetchAddresses} class="text-sm font-bold text-red-600 hover:underline">
            {t.retry}
          </button>
        </div>
      )}

      {loading ? (
        <div class="text-center py-12 text-body-color">
          <span class="material-symbols-outlined text-4xl mb-2 block animate-pulse">location_on</span>
          <p>{t.loading}</p>
        </div>
      ) : addresses.length === 0 ? (
        <div class="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
          <span class="material-symbols-outlined text-5xl text-muted opacity-30 mb-3 block">add_location</span>
          <p class="font-semibold text-headline mb-1">{t.noAddresses}</p>
          <p class="text-sm text-body-color mb-6">{t.noAddressesHint}</p>
          <button onClick={openAddForm} class="btn-primary inline-flex">
            {t.add}
          </button>
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} class="bg-white rounded-xl border border-border shadow-sm p-5 relative group">
              {a.isDefault && (
                <span class="tag-green text-xs absolute top-3 right-3">{t.defaultBadge}</span>
              )}
              <div class="space-y-1.5">
                {a.label && <p class="text-[11px] font-bold text-body-color uppercase tracking-widest">{a.label}</p>}
                {(a.firstName || a.lastName) && <p class="font-semibold text-text-main">{a.firstName} {a.lastName}</p>}
                {a.addressLine1 && <p class="text-sm text-body-color">{a.addressLine1}</p>}
                {a.addressLine2 && <p class="text-sm text-body-color">{a.addressLine2}</p>}
                {[a.city, a.state, a.postalCode].filter(Boolean).length > 0 && (
                  <p class="text-sm text-body-color">{[a.city, a.state, a.postalCode].filter(Boolean).join(', ')}</p>
                )}
                {a.countryCode && <p class="text-xs text-body-color">{countries.find(c => c.code === a.countryCode)?.name || a.countryCode}</p>}
              </div>
              <div class="flex gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => openEditForm(a)} class="text-xs font-bold text-primary hover:underline">
                  {t.edit}
                </button>
                <button onClick={() => handleDelete(a.id)} class="text-xs font-bold text-red-500 hover:underline">
                  {t.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={closeForm}>
          <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg overflow-y-auto" style={{ maxHeight: 'min(92dvh, 90vh)' }} onClick={e => e.stopPropagation()}>
            <div class="flex items-center justify-between p-5 border-b border-border">
              <h2 class="text-lg font-bold text-headline">{editingId ? t.editTitle : t.addTitle}</h2>
              <button onClick={closeForm} class="text-body-color hover:text-headline">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} class="p-5 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="field-label">{t.name}</label>
                  <input name="givenName" value={formData.givenName} onChange={handleInputChange} class="field-input !pl-3 mt-1" placeholder="John" />
                </div>
                <div>
                  <label class="field-label">{t.lastName}</label>
                  <input name="familyName" value={formData.familyName} onChange={handleInputChange} class="field-input !pl-3 mt-1" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label class="field-label">{t.country} *</label>
                {countriesLoading ? (
                  <div class="field-input !pl-3 mt-1 text-muted flex items-center gap-2">
                    <span class="inline-block w-3 h-3 border-2 border-muted border-t-transparent rounded-full animate-spin"></span>
                    {lang === 'es' ? 'Cargando países...' : 'Loading countries...'}
                  </div>
                ) : (
                  <>
                    <input type="text" value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                      placeholder={lang === 'es' ? 'Buscar país...' : 'Search country...'}
                      class="field-input !pl-3 mt-1 mb-1.5 text-sm" />
                    <select name="countryCode" value={formData.countryCode}
                      onChange={e => { handleInputChange(e); setCountrySearch(''); }}
                      class={`field-input !pl-3 mt-1 ${fieldErrors.countryCode ? '!border-red-400' : ''}`}>
                      <option value="">{lang === 'es' ? '— Seleccionar —' : '— Select —'}</option>
                      {countries
                        .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                        .map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                  </>
                )}
                {fieldErrors.countryCode && <p class="text-xs text-red-500 mt-1">{fieldErrors.countryCode}</p>}
              </div>

              <div>
                <label class="field-label">{t.addressLine1} *</label>
                <input name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} class={`field-input !pl-3 mt-1 ${fieldErrors.addressLine1 ? '!border-red-400' : ''}`} placeholder="123 Main St" />
                {fieldErrors.addressLine1 && <p class="text-xs text-red-500 mt-1">{fieldErrors.addressLine1}</p>}
              </div>

              <div>
                <label class="field-label">{t.addressLine2}</label>
                <input name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} class="field-input !pl-3 mt-1" placeholder="Apt 4B" />
              </div>

              <div class="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div>
                  <label class="field-label">{t.city} *</label>
                  <input name="locality" value={formData.locality} onChange={handleInputChange} class={`field-input !pl-3 mt-1 ${fieldErrors.locality ? '!border-red-400' : ''}`} placeholder="Miami" />
                  {fieldErrors.locality && <p class="text-xs text-red-500 mt-1">{fieldErrors.locality}</p>}
                </div>
                <div>
                  <label class="field-label">{t.state} {formData.countryCode === 'US' ? '*' : ''}</label>
                  {statesLoading ? (
                    <div class="field-input !pl-3 mt-1 text-muted flex items-center gap-2">
                      <span class="inline-block w-3 h-3 border-2 border-muted border-t-transparent rounded-full animate-spin"></span>
                      {lang === 'es' ? 'Cargando...' : 'Loading...'}
                    </div>
                  ) : states.length > 0 ? (
                    <select name="administrativeArea" value={formData.administrativeArea} onChange={handleInputChange}
                      class={`field-input !pl-3 mt-1 ${fieldErrors.administrativeArea ? '!border-red-400' : ''}`}>
                      <option value="">{lang === 'es' ? '— Seleccionar —' : '— Select —'}</option>
                      {states.map(s => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input name="administrativeArea" value={formData.administrativeArea} onChange={handleInputChange}
                      class={`field-input !pl-3 mt-1 ${fieldErrors.administrativeArea ? '!border-red-400' : ''}`}
                      placeholder={formData.countryCode === 'US' ? 'FL' : ''} />
                  )}
                  {fieldErrors.administrativeArea && <p class="text-xs text-red-500 mt-1">{fieldErrors.administrativeArea}</p>}
                </div>
              </div>

              <div class="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div>
                  <label class="field-label">{t.postalCode} {formData.countryCode === 'US' ? '*' : ''}</label>
                  <input name="postalCode" value={formData.postalCode} onChange={handleInputChange} class={`field-input !pl-3 mt-1 ${fieldErrors.postalCode ? '!border-red-400' : ''}`} placeholder="33101" />
                  {fieldErrors.postalCode && <p class="text-xs text-red-500 mt-1">{fieldErrors.postalCode}</p>}
                </div>
                <div>
                  <label class="field-label">{t.label}</label>
                  <input name="label" value={formData.label} onChange={handleInputChange} class="field-input !pl-3 mt-1" placeholder={t.labelHint} />
                </div>
              </div>

              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} class="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span class="text-sm font-medium text-text-main">{t.isDefault}</span>
              </label>

              {saveError && (
                <div class="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">{saveError}</div>
              )}

              <div class="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} class="btn-buy text-sm !h-10">{t.cancel}</button>
                <button type="submit" disabled={saving} class="btn-primary text-sm !h-10">
                  {saving ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
