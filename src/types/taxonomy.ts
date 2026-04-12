// src/types/taxonomy.ts

import type { DrupalFile } from '@/types/commerce';

// ── Término de taxonomía genérico ─────────────────────────────────────────────

export interface TaxonomyTermBase {
  type: string;
  id: string;
  drupal_internal__tid: number;
  name: string;
  weight: number;
  status: boolean;
}

// ── Término concreto: categorias_de_flores ────────────────────────────────────

export interface CategoriaDeFlores extends TaxonomyTermBase {
  type: 'taxonomy_term--categorias_de_flores';
  field_foto: DrupalFile | null;
}

// ── Resultado de la consulta ──────────────────────────────────────────────────

export interface TaxonomyQueryResult<T extends TaxonomyTermBase> {
  terms: T[];
  total: number;
}