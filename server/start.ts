import app from "./app";

if (process.env.SKIP_SERVER_START !== "true") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  console.log("SKIP_SERVER_START is true: not starting the server.");
}