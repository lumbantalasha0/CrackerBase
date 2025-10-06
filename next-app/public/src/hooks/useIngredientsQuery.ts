import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/queryClient';

export type Ingredient = { id?: number; name: string; multiplier: number };

export function useIngredientsQuery() {
  const q = useQuery({
    queryKey: ['/api/ingredients'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/ingredients');
      return res.json();
    }
  });

  const create = useMutation({
    mutationFn: (data: { name: string; multiplier: number }) => apiRequest('POST', '/api/ingredients', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    }
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/ingredients/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    }
  });

  return { ...q, create, remove };
}

export default useIngredientsQuery;
