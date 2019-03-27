var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dbiwboq5k', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX - show all campgrounds
router.get("/", function(req, res){
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({$or:[{name: regex,}, {location: regex}, {"author.username":regex}]}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              if(allCampgrounds.length < 1){
                req.flash("error", "No matches, please try again.");
                return res.redirect("back");
              }
              res.render("campgrounds/index",{campgrounds:allCampgrounds, page: "campgrounds"});
           }
        });
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              res.render("campgrounds/index",{campgrounds:allCampgrounds});
           }
        });
    }
});

//CREATE - add new campground to DB

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          console.log(err);
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
            req.body.campground.lat = data[0].latitude;
            req.body.campground.lng = data[0].longitude;
            req.body.campground.location = data[0].formattedAddress;
        
            // add cloudinary url for the image to the campground object under image property
            req.body.campground.image = result.secure_url;
            // add image's public_id to campground object
            req.body.campground.imageId = result.public_id;
            // add author to campground
            req.body.campground.author = {
              id: req.user._id,
              username: req.user.username
            };
          Campground.create(req.body.campground, function(err, campground) {
            if (err) {
              req.flash('error', err.message);
              return res.redirect('back');
            }
            res.redirect('/campgrounds/' + campground.id);
          });
      });
      
    });
});


//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path:"reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            console.log(foundCampground);
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground}); 
    });
});

//UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), (req, res) => {
    Campground.findById(req.params.id, async (err, campground) => { // finds the camp
        if(err){
            console.log(err);
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) { //the logic below will fire up only if the user is uploading an image file while editing a camp
                try {
                    await cloudinary.v2.uploader.destroy(campground.imageId);
                    let result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;
                } catch(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
//geocoder logic below will always check the "location" field in the edit form,  "prettyfy" the address and get the geo coordinates 
            geocoder.geocode(req.body.campground.location, (err, data) => { //assuming that your new.ejs campground form is using the following format: name="campground[location]"; otherwise use req.body.location
                if(err || !data.length) {
                    console.log(err);
                    req.flash('error', 'Invalid address');
                    return res.redirect('back');
                }//end of geocoder logic
//update the camp object and save the changes to the DB
            campground.lat = data[0].latitude;
            campground.lng = data[0].longitude;
            campground.location = data[0].formattedAddress;
            campground.name = req.body.campground.name; //assuming that your new.ejs campground form is using the following format: name="campground[name]" etc;
            campground.description = req.body.campground.description; //idem
            campground.price = req.body.campground.price; //idem; if you didn't add this functionality yet, just delete this line
            campground.save();
            req.flash("success", "Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
            });
        }
    });
});
 

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, async function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
             req.flash("error", err.message);
             return res.redirect("back");
        } else {
            // deletes all comments associated with the campground
            Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                // deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campgrounds");
                });
            });
        }
    });
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;

