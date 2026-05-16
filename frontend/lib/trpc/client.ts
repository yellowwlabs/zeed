import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter as BackendAppRouter } from "../../../backend/src/root";

export type { BackendAppRouter as AppRouter };

export const trpc = createTRPCReact<BackendAppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001"}/trpc`,
        transformer: superjson,
        headers: () => {
          const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
