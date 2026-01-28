import { create } from 'zustand';
import { User, FilterState, DataType, AggregationType } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Inicializar desde localStorage
  const storedToken = authService.getToken();
  
  return {
    user: null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    
    login: (token: string) => {
      authService.setToken(token);
      set({ token, isAuthenticated: true });
    },
    
    logout: () => {
      authService.logout();
      set({ user: null, token: null, isAuthenticated: false });
    },
    
    setUser: (user: User) => {
      set({ user });
    },
  };
});

interface FilterStore extends FilterState {
  setYear: (year: number) => void;
  setMonth: (month: number | undefined) => void;
  setDay: (day: number | undefined) => void;
  setHour: (hour: number | undefined) => void;
  setDate: (date: Date | undefined) => void;
  setNode1: (nodeId: number | undefined) => void;
  setNode2: (nodeId: number | undefined) => void;
  setAggregationType: (type: AggregationType) => void;
  setDataType: (type: DataType) => void;
  setMarket: (market: string) => void;
  resetFilters: () => void;
}

const initialFilterState: FilterState = {
  selectedYear: new Date().getFullYear(),
  selectedMonth: undefined,
  selectedDay: undefined,
  selectedHour: undefined,
  selectedDate: new Date(),
  selectedNode1: undefined,
  selectedNode2: undefined,
  aggregationType: AggregationType.AVG,
  dataType: DataType.PRICE,
  market: 'ERCOT',
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialFilterState,
  
  setYear: (year) => set({ selectedYear: year }),
  setMonth: (month) => set({ selectedMonth: month }),
  setDay: (day) => set({ selectedDay: day }),
  setHour: (hour) => set({ selectedHour: hour }),
  setDate: (date) => set({ selectedDate: date }),
  setNode1: (nodeId) => set({ selectedNode1: nodeId }),
  setNode2: (nodeId) => set({ selectedNode2: nodeId }),
  setAggregationType: (type) => set({ aggregationType: type }),
  setDataType: (type) => set({ dataType: type }),
  setMarket: (market) => set({ market }),
  
  resetFilters: () => set(initialFilterState),
}));
