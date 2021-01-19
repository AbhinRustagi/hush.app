const router = require("express").Router();
const User = require("../models/User");
const passport = require("passport");

router.route("/secrets").get((req, res) => {
  User.find({ secret: { $ne: null } }, function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers });
      }
    }
  });
});

router
  .route("/submit")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  })
  .post((req, res) => {
    const Secret = req.body.secret;
    User.findById(req.user.id, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = Secret;
          foundUser.save(function () {
            res.redirect("/secrets");
          });
        }
      }
    });
  });

module.exports = router;
