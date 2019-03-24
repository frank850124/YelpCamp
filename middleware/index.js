var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");
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

module.exports = middlewareObj;


