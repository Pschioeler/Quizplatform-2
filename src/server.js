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
const app = express();
const fs = require("fs");
//brug moduler ved: const myModule = require('./modules/myModule');
const checkCredentials = require("./Modules/encryption");
const { error } = require("console");

app.use(cors());

app.use(express.static(path.join(__dirname, '../public')));

app.use(logger);

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
app.use(bodyParser.urlencoded({ extended: true }));
//Body-parser til json requests
app.use(bodyParser.json());



/*
Middleware til authentication tjek
Hver Route skal have en auth i deres app.get
*/
function auth(req, res, next) {
  if (req.session.authenticated) {
    console.log("authentication happend")
    next(); // User is authenticated, continue to next middleware
  } else {
    res.redirect("/"); // User is not authenticated, redirect to login page
  }
}

/*
Middleware til authentication tjek
Hver Route skal have en auth i deres app.get
*/
function authAdmin(req, res, next) {
  if (req.session.admin) {
    console.log("admin authentication happend")
    next(); // User is authenticated, continue to next middleware
  } else {
    res.redirect("/"); // User is not authenticated, redirect to login page
  }
}

/*
Middleware til at logge url request
*/
function logger(req, res, next) {
  console.log(req.originalUrl)
  next();
}


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
})


app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'signup.html'));
})

app.get("/dashboard", auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
})

app.get("/quiz", auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'quiz.html'));
})

app.get("/admin", authAdmin, auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin.html'));
})

//Lav endpoints her via app.get eller lignende
app.post("/signedup", async (req, res) => {
  const { username, password } = req.body;
  const isValidPassword = validatePassword(password);
  if (!isValidPassword) {
    console.log("Password does not meet requirements");
    return res
      .status(400)
      .json({ error: "Adgangskoden opfylder ikke kravene." });
  }

  // Register user
  const result = await checkCredentials.registerUser(username, password);
  res.redirect("/")
});

app.post("/login", async (req, res) => {
console.log(req.body);
  const { username, password } = req.body;
  try {
      // Check bruger oplysninger
      let user = await checkCredentials.loginUser(username, password);
      console.log(user);
      if (user instanceof Error) { // Checking if the returned value is an instance of Error
        console.log("Login failed: ", user.message);
        res.redirect("/");
      } else {
        req.session.authenticated = true;
        //req.session.user = user.id;
        if (user.isAdmin === true) {
            req.session.admin = true;
            console.log("i got here to admin");
            res.redirect("/admin");
          } else {
            console.log("i got here to user");
            req.method = 'get';
            //res.redirect("/index.html");
            res.redirect("/dashboard")
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

app.get("/quiz/user-results", auth, quizController.getResultsForUser);

app.get("/quiz/results/download", (req, res) => {
  const resultsPath = path.join(__dirname, "../DB/results.json");
  res.download(resultsPath);
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
app.post('/upload', auth, upload.any(), (req, res) => {
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