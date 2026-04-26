// backend/server.js

const app = require("./app");

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Mail API listening on http://localhost:${PORT}`);
});