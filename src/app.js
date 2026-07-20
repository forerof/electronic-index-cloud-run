import express from "express";

import routes from "./routes/index.js";

const app = express();

app.use(express.json());

app.use(
  express.raw({
    type: "application/pdf",
    limit: "20mb",
  }),
);

app.use("/api/v1", routes);

export default app;