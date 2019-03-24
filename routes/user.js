var express = require("express");
var router  = express.Router({mergeParams: true});
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");

// USER PROFILE
router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if(err) {
      req.flash("error", "Something went wrong.");
      return res.redirect("/");
    }
    Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
      if(err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("/");
      }
      res.render("users/show", {user: foundUser, campgrounds: campgrounds});
    });
  });
});

//EDITING USER INFO
router.get("/users/:id/edit", middleware.checkUserOwnership, function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if(err){
            req.flash("error", "Something went wrong.");
            return res.redirect("/");
        }
         res.render("users/edit", {user: foundUser});
    });
});
 
// UPDATE USER INFO
router.put("/users/:id", middleware.checkUserOwnership, function (req, res) {
    User.findByIdAndUpdate(req.user._id, req.body.user, function(err, updatedUser) { 
        if (err) {
            res.redirect("/");
        } else { 
            res.redirect("/users/" + req.user._id);
        }
    });
});

module.exports = router;