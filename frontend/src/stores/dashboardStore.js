import { create } from 'zustand';

const useDashboardStore = create((set) => ({
  // Dashboard state
  modules: [],
  filter: 'all', // 'all', 'completed', 'in-progress', 'draft'
  searchTerm: '',
  
  // Actions
  setFilter: (filter) => set(() => ({ filter })),
  setSearchTerm: (searchTerm) => set(() => ({ searchTerm })),
  setModules: (modules) => set(() => ({ modules }))
}));

export default useDashboardStore;