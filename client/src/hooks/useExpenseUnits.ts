import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/queryClient';

export type ExpenseUnit = { id?: number; item: string; unitCost: number; unit: string };

export function useExpenseUnitsQuery() {
  const q = useQuery({
    queryKey: ['/api/expense-units'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/expense-units');
      return res.json();
    }
  });

  const create = useMutation({
    mutationFn: (data: { item: string; unitCost: number; unit: string }) => 
      apiRequest('POST', '/api/expense-units', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/expense-units'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    }
  });

  const update = useMutation({
    mutationFn: (data: { id: number; item: string; unitCost: number; unit: string }) =>
      apiRequest('PUT', `/api/expense-units/${data.id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/expense-units'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    }
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/expense-units/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/expense-units'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    }
  });

  return { ...q, create, update, remove };
}

export default useExpenseUnitsQuery;
