import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import compression from "compression";
import helmet from "helmet";

import mainRouter from "./routes/routes.js";
import usersRouter from "./routes/email.js";

const app = express();

app.disable("x-powered-by");

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(compression());

// be aware of helmet configurations for you best use case https://helmetjs.github.io/
app.use(helmet());

app.use("/", mainRouter);
app.use("/users", usersRouter);
// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // only providing detailed error in development
  res.status(err.status || 500);
  return res.json(req.app.get("env") === "development" ? err : { err: "Ops." });
});

export default app;
