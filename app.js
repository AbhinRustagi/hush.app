//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

app.route("/")
  .get(function(req, res){
    res.render("home");
  });

app.route("/login")
  .get(function(req, res){
    res.render("login");
  });

app.route("/register")
  .get(function(req, res){
    res.render("register");
  });

app.listen(8888, function(){
  console.log("Server started on Port 8888.");
});
