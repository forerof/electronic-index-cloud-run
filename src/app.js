import express from "express";

import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";

const app = express();

app.use(express.json());

app.use(
  express.raw({
    type: "application/pdf",
    limit: "20mb",
  }),
);

app.use("/api/v1", routes);

// Debe ir SIEMPRE al final
app.use(errorHandler);

export default app;