//Brug express
const express = require('express');
// Bruges til Session ID
const session = require('express-session');
//This is for JSON files
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const validatePassword = require('../src/Modules/passwordValidator');
//modules:
const quizController = require("./Modules/quizController");
const { registerUser, loginUser} = require('../src/Modules/encryption');
const app = express();
const fs = require("fs");
//brug moduler ved: const myModule = require('./modules/myModule');

// paths
const usersFilePath = path.join(__dirname, "./DB/users.json");

app.use(cors());

app.use(session({
    // secret kan/burde ændres til noget andet
    secret: 'super-hemmelig-noegle',
    cookie: { maxAge: 3600000 }, // gemmer session i 1 time
    saveUninitialized: false,
    resave: false,
    //cookie: { secure: true }
}));

//Body-parser til url encoded requests
app.use(bodyParser.urlencoded({ extended: false }));
//Body-parser til json requests
app.use(bodyParser.json());

//Lav endpoints her via app.get eller lignende
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    const isValidPassword = validatePassword(password);
    if (!isValidPassword) {
        console.log("Password does not meet requirements");
        return res.status(400).json({ error: 'Adgangskoden opfylder ikke kravene.' });
    }

    // Register user
    const result = await registerUser(username, password);
    res.json({ message: result });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const loginResult = await loginUser(username, password);
    res.json({ message: loginResult });
});

// Indlæs quizzer ved opstart
quizController.loadQuizzes();

/* 
Login route, sætter user id 
*/
app.post('/login', (req, res) => {
    console.log(req.sessionID);
    // tager et eventuelt username og password fra body
    let { username, password } = req.body;
    // Læs brugere fra DB
    let users = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));
    // find og tjek username og password
    const user = users.find(
        (u) => u.username === username && u.password === password
    );
        
    if (!user) {
        res.status(403).json({msg: 'Bad Credentials'});
        res.end("Invalid Username");
    } else {
        req.session.authenticated = true;
        req.session.user = user.username;
        res.json(req.session);
            if (user.isAdmin === true) {
                //res.redirect("/adminpanel");
            } else {
                //res.redirect("/dashboard");
            }
    }
});

/* 
Dashbord route
*/
app.get('/dashboard', requireAuth, (req, res) => {
    // Render the dashboard page
});

/*
Admin route
*/
app.get('/admin', requireAuth, (req, res) => {
    // Render the admin page
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
        res.send("Error");
      } else {
        res.render("index", { title: "Login", logout: "Logout Succesfully!" });
      }
    });
  });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});