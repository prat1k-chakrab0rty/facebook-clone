const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const app = express();
// mongoose.connect('mongodb://localhost:27017/facebookDB');
mongoose.connect('mongodb+srv://admin-pratik:Test123@cluster0.8dd5k.mongodb.net/facebookDB');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let isUser = null;

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const friendSchema = new mongoose.Schema({
    id: String,
    friendid: String,
});

const friendRequestSchema = new mongoose.Schema({
    id: String,
    friendid: String,

});

const profileSchema = new mongoose.Schema({
    id: String,
    post: String,
    type: String,
    visibility: String,
});

const postSchema = new mongoose.Schema({
    post: String
});

const User = mongoose.model('User', userSchema);
const Profile = mongoose.model('Profile', profileSchema);
const Friend = mongoose.model('Friend', friendSchema);
const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
const Post = mongoose.model('Post', postSchema);
const PostCopy = mongoose.model('PostCopy', postSchema);

app.get("/", function (req, res) {
    res.redirect("/login_signup")
})

app.get("/login_signup", function (req, res) {
    res.render("sign-up")
})

app.post("/signup", function (req, res) {
    User.findOne({ email: req.body.email }, function (err, documentFromDB) {
        if (err)
            console.log(err);
        else {
            if (documentFromDB === null) {
                if (req.body.password === req.body.confirm) {

                    const user = new User({
                        name: req.body.name,
                        email: req.body.email,
                        password: req.body.password
                    });
                    user.save();
                    console.log("User created");
                    isUser = req.body.email;
                    res.redirect("/myprofile")
                }
                else {
                    console.log("Password not matching");
                }
            }
            else {
                console.log("You already have an account");
            }

        }
    })
})

app.post("/login", function (req, res) {
    User.findOne({ email: req.body.email }, function (err, documentFromDB) {
        if (req.body.password === documentFromDB.password) {
            isUser = req.body.email;
            res.redirect("/myprofile")
        }
    })
})

app.get("/myprofile", function (req, res) {
    if (isUser) {
        mongoose.connection.db.listCollections({ name: 'posts' })
            .next(function (err, collinfo) {
                if (collinfo) {
                    mongoose.connection.dropCollection("posts");
                }
            });
            mongoose.connection.db.listCollections({ name: 'postcopies' })
            .next(function (err, collinfo) {
                if (collinfo) {
                    mongoose.connection.dropCollection("postcopies");
                }
            });
        Friend.find({ id: isUser }, function (err, friends) {
            console.log(friends)
            for (let i = 0; i < friends.length; i++) {
                Profile.find({ id: friends[i].friendid }, function (err, posts) {
                    for (let j = 0; j < posts.length; j++) {
                        // console.log(posts[j].post);
                        const posteach = new Post({
                            post: posts[j].post
                        });
                        posteach.save();
                        const posteach1 = new PostCopy({
                            post: posts[j].post
                        });
                        posteach1.save();
                    }
                })
            }
        })
        Profile.find({ id: isUser }, function (err, postsFromDB) {
            console.log(postsFromDB.length);
            User.findOne({ email: isUser }, function (err, userFromDB) {
                if (userFromDB === null)
                    res.render("myprofile", { Posts: postsFromDB, Name: null });
                else
                    res.render("myprofile", { Posts: postsFromDB, Name: userFromDB.name });
            })
        })
    }
    else {
        console.log("Login or Sign Up first!!!");
    }
})

app.post("/myprofile", function (req, res) {
    const newPost = new Profile({
        id: isUser,
        post: req.body.post,
        type: "text",
        visibility: req.body.visibility
    });
    newPost.save();
    res.redirect("/myprofile");
})

app.get("/friendlist", function (req, res) {
    User.findOne({ email: isUser }, function (err, userFromDB) {
        Friend.find({ id: isUser }, function (err, friendsFromDB) {
            FriendRequest.find({ id: isUser }, function (err, friendRequestsFromDB) {

                res.render("friendlist", { Friends: friendsFromDB, FriendRequests: friendRequestsFromDB });
            })
        })
    })
})

app.post("/friendlist", function (req, res) {
    res.redirect("/friendlist");
})

app.post("/addfriend", function (req, res) {
    User.findOne({ email: req.body.friendid }, function (err, userFromDB) {
        console.log("found ", userFromDB.email);
        const newRequest = new FriendRequest({
            id: req.body.friendid,
            friendid: isUser
        });
        newRequest.save();
        // FriendRequest.findOneAndUpdate({id:req.body.friendid},{friendRequests:friendreqs});
        // console.log(userFromDB.friendRequests);
        res.redirect("/friendlist");
    })
})

app.get("/logout", function (req, res) {
    // Post.find({}, function (err, post) {
    //     if (post) {
    //         mongoose.connection.dropCollection("posts");
    //     }
    // })
    isUser = null;
    res.redirect("/");
})

app.post("/addrequest/:friendreq", function (req, res) {
    FriendRequest.findOneAndDelete({
        id: isUser
    }, function (err) {
        let newFriend = new Friend({
            id: isUser,
            friendid: req.params.friendreq
        });
        newFriend.save();
        newFriend = new Friend({
            id: req.params.friendreq,
            friendid: isUser
        });
        newFriend.save();
        res.redirect("/friendlist")
    });
});

app.post("/rejectrequest/:friendreq", function (req, res) {
    FriendRequest.findOneAndDelete({
        id: isUser
    }, function (err) {
        res.redirect("/friendlist")
    });
});

app.post("/deletefriend/:friend", function (req, res) {
    Friend.findOneAndDelete({
        id: isUser
    }, function (err) {
        Friend.findOneAndDelete({
            friendid: isUser
        }, function (err) {
            res.redirect("/friendlist")
        });
    });
})

app.get("/community", function (req, res) {


    PostCopy.find({}, function (err, posts) {
        // mongoose.connection.db.dropCollection(
        //     "posts",
        //     function (err, result) {
        //         console.log("Collection droped");
        res.render("community", { Posts: posts })
    })

    // })
});

app.post("/community", function (req, res) {

    res.redirect("/community");
});

app.post("/myprofil", function (req, res) {
    res.redirect("/myprofile");
})


app.post("/deletepost/:post", function (req, res) {
    Profile.findOneAndDelete({
        post: req.params.post
    }, function (err) {
        res.redirect("/myprofile")
    });

})

app.post("/nextpage", function (req, res) {
    PostCopy.find({},function(err,result){
        if(result.length>=10){

            for (let i = 0; i < 5; i++) {
                PostCopy.findOneAndDelete({},function(err){
                })
            }
            res.redirect("/community");
        }
        else{
            res.render("uptodate");
        }
    })

})

app.post("/visibility/:postName",function(req,res){
    var visi;
    Profile.findOne({post:req.params.postName},function(err,result){
        if(result.visibility==="all"){
            visi="onlyfriends";
        }
        else
        {
            visi="all";
        }
        console.log(visi);
        Profile.findOneAndUpdate({post:req.params.postName},{visibility:visi},function(err){

            res.redirect("/myprofile");
        });
    })
})

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000");
});
