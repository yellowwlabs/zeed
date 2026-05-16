import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./root";
import { createTRPCContext } from "./trpc";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => {
        return createTRPCContext({ req, res });
    },
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;