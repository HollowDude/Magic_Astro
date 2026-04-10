import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import type { CommerceProduct } from '../../types/commerce';

// Instanciamos el formateador
const dataFormatter = new Jsona();
const BASE_URL = 'http://localhost:8080/jsonapi';

export async function getProducts(productType = 'default'): Promise<CommerceProduct[]> {
  // 1. Construimos la query compleja para JSON:API
  const apiParams = new DrupalJsonApiParams();
  
  apiParams
    // Solo productos publicados
    .addFilter('status', '1') 
    // ¡VITAL! Incluimos las variaciones en la misma petición
    .addInclude(['variations']) 
    // Pedimos solo los campos que necesitamos para optimizar el payload
    .addFields(`commerce_product--${productType}`, ['title', 'body', 'variations'])
    .addFields(`commerce_product_variation--${productType}`, ['sku', 'price', 'title']);

  // Construimos la URL final
  const url = `${BASE_URL}/commerce_product/${productType}?${apiParams.getQueryString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error fetching products from Drupal');
    
    const rawJson = await response.json();

    // 2. Aquí ocurre la magia: Jsona convierte el JSON:API estricto 
    // en un array de objetos limpios que coinciden con nuestra interfaz.
    const products = dataFormatter.deserialize(rawJson) as CommerceProduct[];

    return products;
  } catch (error) {
    console.error("Error en el servicio de Commerce:", error);
    return [];
  }
}