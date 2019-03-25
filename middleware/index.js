var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");
var Review = require("../models/review");
//all the middleware goes here
var middlewareObj= {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                req.flash("error", "Campground not found");
                res.redirect("back");
            } else{
                //dose user own the campground
                if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    next(); 
                } else{
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
            Comment.findById(req.params.comment_id, function(err, foundComment){
                if(err || !foundComment){
                    req.flash("error", "Comment not found");
                    res.redirect("back");
                } else{
                    //dose user own the comment
                    if(foundComment.author.id.equals(req.user._id)|| req.user.isAdmin){
                        next(); 
                    } else{
                        req.flash("error", "You don't have permission to do that");
                        res.redirect("back");
                    }
                }
            });
        } else{
            req.flash("error", "You need to be logged in to do that");
            res.redirect("back");
    }
};

middlewareObj.checkUserOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        // If the profiles can be visited from the comments page, you can use the comment.author.id in an <a> tag to pass the the link into params as 'userid' for example
        // If profile is clickable as a campground author, you can use campground.author.id in an <a> tag to pass the the link into params as 'userid' for example
        if(req.user._id.equals(req.params.id)) {
            next();
        } else {
            req.flash("error", "Access denied, this is not your profile.");
            res.redirect("back");
        }
    } else {
        req.flash("error", "You are not logged in.");
        res.redirect("back");
    }
};



middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id).populate("reviews").exec(function (err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/campgrounds/" + foundCampground._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

module.exports = middlewareObj;


