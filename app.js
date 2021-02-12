var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var multer = require("multer");
var fs = require('fs');
var fileupload = require('express-fileupload');
var cors = require('cors');
const Joi = require("@hapi/joi");
var indexRouter = require("./routes/index");

var app = express();
//********************************** */

// *******************************************
// Serve static assets if in Production 
if(process.env.NODE_ENV === "production") {
  // set static folder
  app.use(express.static('client/build'));
  app.get('*',(req, res) => {
    res.sendFile(path.resolve(__dirname,'client','build','index.html'))
  })
}
// *******************************************

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileupload());
app.use(multer({dest:'./uploads/'}).single() );
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static('public'));

app.use(cors());

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "production" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
