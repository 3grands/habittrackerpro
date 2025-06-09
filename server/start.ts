#!/usr/bin/env tsx
import app from "./index";

const PORT = parseInt(process.env.PORT ?? "5000", 10);
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
}).on('error', (err: Error) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});
