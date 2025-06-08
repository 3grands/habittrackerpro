#!/usr/bin/env tsx
import app from "./index";

const PORT = parseInt(process.env.PORT ?? "5000", 10);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
