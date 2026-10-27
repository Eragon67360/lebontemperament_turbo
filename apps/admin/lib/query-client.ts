import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache retention (formerly cacheTime)
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet reconnects
    },
    mutations: {
      // A failed write is never re-sent on its own: a save whose answer was
      // lost on the way back (a reset connection, a gateway timeout) may
      // have gone through, and sending it again records it twice (a
      // payment, a concert, a whole rehearsal series). The admin retries by
      // hand, with the list refreshed. Reads keep their retries above.
      retry: 0,
    },
  },
});
