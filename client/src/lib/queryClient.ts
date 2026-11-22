import { QueryClient } from "@tanstack/react-query";

// There is deliberately no default queryFn: every query must say which
// manager endpoint it calls (see lib/api.ts). A query without one fails
// loudly instead of fetching its key as a URL against the page origin.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey }) => {
        throw new Error(`No queryFn for query ${JSON.stringify(queryKey)}`);
      },
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
