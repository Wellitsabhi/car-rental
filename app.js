const express = require("express");

const app = express();
app.use(express.json());

app.use("/auth", require("./routes/auth.routes"));
app.use("/bookings", require("./routes/bookings.routes"));

module.exports = app;
