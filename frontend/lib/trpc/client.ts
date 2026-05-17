"use client";

import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppRouter = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact<AppRouter>() as any;

export function createTRPCClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (trpc as any).createClient({
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
