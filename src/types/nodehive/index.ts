/**
 * Re-exporta todo desde la carpeta nodehive.
 * Esto permite que los imports existentes NO se rompan:
 *   import type { FlowerProduct } from '@/types/nodehive.commerce'
 *   → sigue funcionando
 *
 * A largo plazo, puedes migrar a:
 *   import type { FlowerProduct } from '@/types/nodehive'
 */

export * from './base';
export * from './taxonomy';
export * from './commerce';
export * from './content';
export * from './service';