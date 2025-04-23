import { create } from 'zustand';

// Sample data for testing
const sampleModules = [
  {
    id: '1',
    name: 'CRM Extension',
    description: 'Extends Odoo CRM with additional features',
    status: 'completed',
    icon: '📊',
    lastUpdated: new Date('2025-04-10').toISOString()
  },
  {
    id: '2',
    name: 'Inventory Management',
    description: 'Custom inventory tracking and management',
    status: 'in-progress',
    icon: '📦',
    lastUpdated: new Date('2025-04-15').toISOString()
  },
  {
    id: '3',
    name: 'HR Analytics',
    description: 'Employee performance and analytics dashboard',
    status: 'draft',
    icon: '👥',
    lastUpdated: new Date('2025-04-20').toISOString()
  }
];

const useModuleStore = create((set, get) => ({
  // Module state
  modules: sampleModules,
  currentModule: null,
  isLoading: false,
  error: null,
  
  // Actions
  fetchModules: async () => {
    try {
      set({ isLoading: true });
      // In a real app, you would fetch from an API
      // const response = await fetch('/api/modules');
      // const data = await response.json();
      
      // For now, use sample data
      set({ modules: sampleModules, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching modules:', error);
    }
  },
  
  getModuleById: (id) => {
    return get().modules.find(module => module.id === id) || null;
  },
  
  addModule: (module) => {
    set((state) => ({
      modules: [...state.modules, {
        ...module,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString()
      }]
    }));
  },
  
  updateModule: (id, updates) => {
    set((state) => ({
      modules: state.modules.map(module => 
        module.id === id ? { 
          ...module, 
          ...updates, 
          lastUpdated: new Date().toISOString() 
        } : module
      )
    }));
  },
  
  deleteModule: (id) => {
    set((state) => ({
      modules: state.modules.filter(module => module.id !== id)
    }));
  }
}));

export default useModuleStore;