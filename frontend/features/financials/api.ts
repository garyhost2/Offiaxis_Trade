import { baseApi } from '../../shared/store/baseApi';

interface Expense {
  _id: string;
  orgId: string;
  projectId?: number | string;
  amount: number;
  category: 'labor' | 'material' | 'warranty' | 'mileage' | 'misc';
  jobType?: string;
  vendor?: string;
  date: string;
  note?: string;
  miles?: number;
  ratePerMile?: number;
  source: 'manual' | 'photo' | 'voice';
  createdBy: string;
}

interface Income {
  _id: string;
  orgId: string;
  projectId?: number | string;
  amount: number;
  type: 'invoice' | 'change_order' | 'service_call' | 'other';
  jobType?: string;
  date: string;
  note?: string;
  createdBy: string;
}

interface ProfitLossSummary {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  breakdown: Record<string, number>;
}

const financialsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listExpenses: builder.query<Expense[], { projectId?: string; startDate?: string; endDate?: string }>({
      query: (params) => ({ url: '/api/profit-loss/expenses', params }),
      providesTags: ['Expense'],
    }),
    createExpense: builder.mutation<Expense, Omit<Expense, '_id' | 'orgId' | 'createdBy'>>({
      query: (body) => ({ url: '/api/profit-loss/expenses', method: 'POST', body }),
      invalidatesTags: ['Expense'],
    }),
    listIncome: builder.query<Income[], { projectId?: string }>({
      query: (params) => ({ url: '/api/profit-loss/income', params }),
      providesTags: ['Income'],
    }),
    createIncome: builder.mutation<Income, Omit<Income, '_id' | 'orgId' | 'createdBy'>>({
      query: (body) => ({ url: '/api/profit-loss/income', method: 'POST', body }),
      invalidatesTags: ['Income'],
    }),
    getProfitLossSummary: builder.query<ProfitLossSummary, { projectId?: string; startDate?: string; endDate?: string }>({
      query: (params) => ({ url: '/api/profit-loss/summary', params }),
      providesTags: ['Expense', 'Income'],
    }),
    getProfitLossBreakdown: builder.query<Record<string, number>, { projectId?: string; startDate?: string; endDate?: string; jobType?: string }>({
      query: (params) => ({ url: '/api/profit-loss/breakdown', params }),
      providesTags: ['Expense'],
    }),
  }),
});

export const {
  useListExpensesQuery,
  useCreateExpenseMutation,
  useListIncomeQuery,
  useCreateIncomeMutation,
  useGetProfitLossSummaryQuery,
  useGetProfitLossBreakdownQuery,
} = financialsApi;
