import { create } from 'zustand';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  code_postal: string;
  type_chauffage?: string;
  notes?: string;
  created_at: string;
}

interface NewClient {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  code_postal: string;
  type_chauffage?: string;
  notes?: string;
}

interface ClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  addClient: (client: NewClient) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BACKEND_URL}/api/clients`);
      set({ clients: response.data, loading: false });
    } catch (error) {
      set({ error: 'Erreur lors du chargement des clients', loading: false });
      console.error('Fetch clients error:', error);
    }
  },

  addClient: async (client: NewClient) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BACKEND_URL}/api/clients`, client);
      const newClient = response.data;
      set(state => ({
        clients: [...state.clients, newClient],
        loading: false
      }));
    } catch (error) {
      set({ error: 'Erreur lors de l\'ajout du client', loading: false });
      throw error;
    }
  },

  updateClient: async (id: string, client: Partial<Client>) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${BACKEND_URL}/api/clients/${id}`, client);
      const updatedClient = response.data;
      set(state => ({
        clients: state.clients.map(c => c.id === id ? updatedClient : c),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Erreur lors de la mise à jour du client', loading: false });
      throw error;
    }
  },

  deleteClient: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${BACKEND_URL}/api/clients/${id}`);
      set(state => ({
        clients: state.clients.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Erreur lors de la suppression du client', loading: false });
      throw error;
    }
  },
}));