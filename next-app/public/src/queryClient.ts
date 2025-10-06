import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Retry wrapper: retry on 503 Service Unavailable with exponential backoff
  const maxRetries = 3;
  let attempt = 0;
  let lastErr: any = null;

  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });

      if (res.status === 503 && attempt < maxRetries) {
        // transient, retry
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000);
        // eslint-disable-next-line no-console
        console.warn(`apiRequest: received 503, retrying in ${delayMs}ms (attempt ${attempt + 1})`);
        await new Promise((r) => setTimeout(r, delayMs));
        attempt++;
        continue;
      }

      await throwIfResNotOk(res);
      return res;
    } catch (err) {
      lastErr = err;
      // If it's a thrown non-503 error, or we've exhausted retries, rethrow
      if (attempt >= maxRetries) throw err;
      const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000);
      // eslint-disable-next-line no-console
      console.warn(`apiRequest error, retrying in ${delayMs}ms (attempt ${attempt + 1}):`, err);
      await new Promise((r) => setTimeout(r, delayMs));
      attempt++;
    }
  }

  // If we exit loop, throw the last error
  throw lastErr || new Error('apiRequest failed');
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
