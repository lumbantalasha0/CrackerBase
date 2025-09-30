// Backwards-compatible wrapper for previous in-memory `useIngredients`.
// Delegates to the React Query backed hook where possible.
import useIngredientsQuery from './useIngredientsQuery';

export type Ingredient = { id?: number; name: string; multiplier: number };

export function useIngredients(): [Ingredient[], (ingredients: Ingredient[]) => void] {
  const { data: ingredients = [] } = useIngredientsQuery();

  // provide a no-op setter to keep the old signature; callers should use the query mutations instead
  function setIngredients(_ingredients: Ingredient[]) {
    // no-op: prefer server-backed mutations via useIngredientsQuery.create/remove
    // This keeps compatibility with existing callers that call setIngredients.
    // If callers rely on immediate local updates, migrate them to the new hook.
    return;
  }

  return [ingredients, setIngredients];
}

export default useIngredients;