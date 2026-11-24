import app from "./app.js";
import { env } from "./config/env.js";

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`[VÉLORA] Server running on http://localhost:${PORT}`);
  console.log(`[VÉLORA] Health check at http://localhost:${PORT}/api/health`);
});
