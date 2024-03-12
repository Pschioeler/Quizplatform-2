//Brug express
const express = require("express");
// Bruges til Session ID
const session = require("express-session");
//This is for JSON files
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
//brug moduler ved: const myModule = require('./modules/myModule');
const checkCredentials = require("./Modules/encryption"); 

const quizController = require("./Modules/quizController");

// paths
const usersFilePath = path.join(__dirname, "./DB/users.json");

app.use(cors());

app.use(express.static(path.join(__dirname, "..", "public")));

app.use(
  session({
    // secret kan/burde ændres til noget andet
    secret: "super-hemmelig-noegle",
    cookie: { maxAge: 3600000 }, // gemmer session i 1 time
    saveUninitialized: false,
    resave: false,
    //cookie: { secure: true }
  })
);

//Body-parser til url encoded requests
app.use(bodyParser.urlencoded({ extended: false }));
//Body-parser til json requests
app.use(bodyParser.json());

//Lav endpoints her via app.get eller lignende

/*
Middleware til authentication tjek
Hver Route skal have en requireAuth i deres app.get
*/
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next(); // User is authenticated, continue to next middleware
  } else {
    res.redirect("/login"); // User is not authenticated, redirect to login page
  }
};

// Indlæs quizzer ved opstart
quizController.loadQuizzes();

app.get("/quizzes", (req, res) => {
  const quizIds = Object.keys(quizController.quizzes);
  res.json(quizIds);
});

// Endpoint for at få et tilfældigt spørgsmål
app.get("/quiz/get-question", quizController.getQuestion);

// Endpoint for at indsende svar på et spørgsmål
app.post("/quiz/submit-answer", quizController.submitAnswer);

// Endpoint for at få resultaterne af en quiz
app.get("/quiz/get-results", quizController.getResults);

app.get("/quiz/results/download", (req, res) => {
  const resultsPath = path.join(__dirname, "../DB/results.json");
  res.download(resultsPath);
});

/* 
Login route, sætter user id 
*/
app.post('/login2', (req, res) => {
    console.log(req.sessionID);
    // tager et eventuelt username og password fra body
    let { username, password } = req.body;

    // Check bruger oplysninger
    checkCredentials.loginUser(username, password)
    /*
    // Læs brugere fra DB
    let users = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));
    console.log(users);
    // find og tjek username og password
    
    const user = users.find(
        (u) => {u.hashedUser === username && u.password === password});        
     */
    if (!user) {
        res.status(403).json({msg: 'Bad Credentials'});
        res.end("Invalid Username");
    } else {
      //res.redirect("/dashboard");
    }
  });

/* 
Dashbord route
*/
app.get("/dashboard", requireAuth, (req, res) => {
  // Render the dashboard page
});

/*
Admin route
*/
app.get("/admin", requireAuth, (req, res) => {
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
