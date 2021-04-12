const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");
dotenv.config();

// JSON Web Token Setup
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// Configure its options
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");

// IMPORTANT - this secret should be a long, unguessable string 
// (ideally stored in a "protected storage" area on the 
// web server, a topic that is beyond the scope of this course)
// We suggest that you generate a random 64-character string
// using the following online tool:
// https://lastpass.com/generatepassword.php 

jwtOptions.secretOrKey = process.env.JWT_SECRET;

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        // The following will ensure that all routes using 
        // passport.authenticate have a req.user._id, req.user.userName, req.user.fullName & req.user.role values 
        // that matches the request payload data
        next(null, { _id: jwt_payload._id, 
            userName: jwt_payload.userName, 
            password: jwt_payload.password}); 
    } else {
        next(null, false);
    }
});



const userService = require("./user-service.js");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
// tell passport to use our "strategy"
passport.use(strategy);

// add passport as application-level middleware
app.use(passport.initialize());

/* TODO Add Your Routes Here */

app.post("/api/user/register", (req, res) => {
    
    userService.registerUser(req.body)
        .then((msg) => {
            res.json({ "message": msg });
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});



app.post("/api/user/login", (req, res) => {
   
    userService.checkUser(req.body)
        .then((user) => {
            
           jwt.sign(user.toJSON(), process.env.JWT_SECRET,(err,data)=>{
                res.json({ "message": "login successful",token:data });
            })
           
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});


app.get("/api/user/favourites",passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.getFavourites(req.user._id)
        .then((favourites) => {
        
            res.json(favourites); //change this line
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});

app.put("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }),(req, res) => {
    
    userService.addFavourite(req.user._id,req.params.id)
        .then((favourites) => {
            res.json({favourites});//
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});


app.delete("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }),(req, res) => {
    userService.removeFavourite(req.user._id,req.params.id)
        .then((favourites) => {
            res.json(favourites);//
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});



userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});