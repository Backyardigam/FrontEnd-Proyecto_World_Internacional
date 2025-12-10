import { atom } from 'nanostores';
import type { FilterState } from './SupervisarViajes.utils';

// Estado inicial
export const filtersAtom = atom<FilterState>({
  serviceId: '',
  schedule: '',
  date: '',
  page: 1, // El backend asume 1, pero lo controlamos aquí
  limit: 20
});

// Acción para actualizar filtros (resetea pagina a 1 cuando se filtra)
export const updateFilters = (newFilters: Partial<Omit<FilterState, 'page' | 'limit'>>) => {
  const current = filtersAtom.get();
  filtersAtom.set({
    ...current,
    ...newFilters,
    page: 1 // Al filtrar, volvemos a la primera página
  });
};

// Acción para cambiar de página
export const setPage = (page: number) => {
  const current = filtersAtom.get();
  filtersAtom.set({ ...current, page });
};