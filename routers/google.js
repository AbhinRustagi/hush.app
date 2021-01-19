const router = require("express").Router();
const passport = require("passport");

router.get("/google", (req, res) => {
  passport.authenticate("google", { scope: ["profile"] });
});

router.get(
  "/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/secrets");
  }
);

module.exports = router;
