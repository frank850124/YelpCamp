var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
   password: String,
   avatar: String,
   firstName: String,
   lastName: String,
   email: {type: String, unique: true, required: true},
   about: String,
   resetPasswordToken: String,
   resetPasswordExpires: Date,
   author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: {
            type: String,
            unique: true,
            required: true
        },
    },
   isAdmin: {type: Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);