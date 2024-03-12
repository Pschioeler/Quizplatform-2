//Brug express
const express = require("express");
// Bruges til Session ID
const session = require("express-session");
//This is for JSON files
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const validatePassword = require("./Modules/passwordValidator");
//modules:
const quizController = require("./Modules/quizController");
const { registerUser, loginUser } = require("./Modules/encryption");
const app = express();
const fs = require("fs");
//brug moduler ved: const myModule = require('./modules/myModule');
const checkCredentials = require("./Modules/encryption");

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

//Lav endpoints her via app.get eller lignende
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const isValidPassword = validatePassword(password);
  if (!isValidPassword) {
    console.log("Password does not meet requirements");
    return res
      .status(400)
      .json({ error: "Adgangskoden opfylder ikke kravene." });
  }

  // Register user
  const result = await registerUser(username, password);
  res.json({ message: result });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
      // Check bruger oplysninger
      let user = checkCredentials.loginUser(username, password);
      if (user) {
        req.body.authenticated = true;
        if (user.isAdmin === true) {
            console.log("i got here to admin");
            res.redirect("/admin");
          } else {
            console.log("i got here to user");
            res.redirect("/index.html");
          }
      }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal server error");
  }
});

// Indlæs quizzer ved opstart
quizController.loadQuizzes();

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
Dashbord route
*/
// app.get('/dashboard', requireAuth, (req, res) => {
//     // Render the dashboard page
// });

// /*
// Admin route
// */
// app.get('/admin', requireAuth, (req, res) => {
//     // Render the admin page
// });

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
