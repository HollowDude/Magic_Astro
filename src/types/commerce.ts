export interface CommercePrice {
  number: string;
  currency_code: string;
  formatted: string;
}

export interface CommerceVariation {
  type: string; // Ej: 'commerce_product_variation--default'
  id: string;
  sku: string;
  title: string;
  price: CommercePrice;
  // Aquí puedes agregar atributos custom, ej: attribute_color, attribute_size
}

export interface CommerceProduct {
  type: string; // Ej: 'commerce_product--default'
  id: string;
  title: string;
  body?: { value: string; format: string };
  variations: CommerceVariation[]; // ¡Relación ya aplanada!
}