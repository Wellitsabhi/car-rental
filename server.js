require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");

pool
  .query("SELECT 1")
  .then(() => console.log("Postgres connected"))
  .catch((err) => console.error(err));

app.listen(3000, () => console.log("Server running on port 3000"));
