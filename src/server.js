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

// paths
const usersFilePath = path.join(__dirname, "../DB/users.json");

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
  const loginResult = await loginUser(username, password);
  console.log(loginResult);
  if (loginResult === "Login successful") {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Indlæs quizzer ved opstart
quizController.loadQuizzes();

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
app.post("/login", (req, res) => {
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
    res.status(403).json({ msg: "Bad Credentials" });
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../src/DB/xml/'));
  },
  filename: function (req, file, cb) {
    // Konverter filnavnet til UTF-8 så filnavne med æ, ø, å osv kan blive gemt ordentligt
    const utf8FileName = Buffer.from(file.originalname, 'binary').toString('utf-8');
    cb(null, utf8FileName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Tjek om filtypen er XML
    if (file.mimetype !== 'text/xml') {
      cb(new Error('Only XML files are allowed'), false);
    } 
    else {
      cb(null, true);
    }
  }
});

// Endpoint for at håndtere upload af filer
app.post('/upload', requireAuth, upload.any(), (req, res) => {
  // Tjek om der blev uploadet en fil
  if (!req.files || req.files.length === 0) {
      return res.status(400).send('No file uploaded.');
  }
  console.log(req.files);
  // Filen blev uploadet succesfuldt
  res.status(200).send('File uploaded successfully');
});

app.get("/quizzes", (req, res) => {
  const quizIds = Object.keys(quizController.quizzes);
  res.json(quizIds);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});