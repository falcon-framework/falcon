import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { de } from "@/i18n/de";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`${de.common.errorPrefix}: ${error.message}`);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
