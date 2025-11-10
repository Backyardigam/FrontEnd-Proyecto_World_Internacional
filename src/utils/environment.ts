/**
 * Una variable booleana que es `true` si el código se está ejecutando en un entorno de navegador,
 * y `false` si se está ejecutando en el servidor (SSR).
 */
export const isBrowser = typeof window !== 'undefined';