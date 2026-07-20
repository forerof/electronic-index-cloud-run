import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log("----------------------------------------");
  console.log("Electronic Index PDF Service");
  console.log(`Server running on port ${env.port}`);
  console.log(`Health: http://localhost:${env.port}/health`);
  console.log("----------------------------------------");
});