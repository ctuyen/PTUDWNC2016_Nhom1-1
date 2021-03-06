require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const logger = require("morgan");
var bodyParser = require("body-parser");
const connectDB = require("./dbs");
var cors = require("cors");

const indexRoute = require("./routes/index");
const apiRoute = require("./routes/api");
const customerRoute = require("./routes/customer");
const employeeRoute = require("./routes/employee");
const administratorRoute = require("./routes/administrator");

const app = express();
const PORT = 3001;

var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(process.env.PORT || PORT, () => {
  console.log("Listing port " + PORT);
});

io.on("connection", function (socket) {
  console.log("Có người kết nối!");
  socket.on("notify", () => {
    console.log("CÓ người thông báo!");
    io.emit("notify", true);
  });
});
//connect mongodb atlas
connectDB();

// var allowCrossDomain = function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET/PUT/POST/DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// };

app.use(cors());
// app.use(allowCrossDomain);

// bodyparser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRoute);
app.use("/api", apiRoute);
app.use("/customers", customerRoute);
app.use("/employees", employeeRoute);
app.use("/administrator", administratorRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500).send("ERROR");
});
