//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("Connection established to the database.");
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

mongoose.set('useCreateIndex', true);

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate); 

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8888/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo/'
  },
  function (accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.route("/")
  .get(function (req, res) {
    res.render("home");
  });

app.get("/auth/google", (req, res) => {
  passport.authenticate("google", { scope: ["profile"] })
});

app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: '/login'}), (req, res) => {
  res.redirect("/secrets");
});

app.route("/login")
  .get(function (req, res) {
    res.render("login");
  })
  .post(function (req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function (err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    });
  });

app.route("/secrets")
.get((req, res) => {
  User.find({"secret": {$ne: null}}, function (err, foundUsers) {
    if(err) {
      console.log(err);
    } else {
      if( foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers})
      }
    }
  })
});

app.route("/submit")
  .get((req, res) => {
    if(req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  })
  .post((req, res) => {
    const Secret = req.body.secret;
    User.findById(req.user.id, (err, foundUser) => {
      if (err) {
        console.log(err)
      } else {
        if (foundUser) {
          foundUser.secret = Secret;
          foundUser.save(function() {
            res.redirect("/secrets");
          });
        }
      }
    });
  });


app.route("/register")
  .get(function (req, res) {
    res.render("register");
  })
  .post(function (req, res) {
    User.register({
      username: req.body.username
    }, req.body.password, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    });
  });

app.route("/logout")
  .get(function (req, res) {
    req.logout();
    res.redirect("/");
  });

app.listen(8888, function () {
  console.log("Server started on Port 8888.");
});