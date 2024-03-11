//Brug express
const express = require('express');
//This is for JSON files
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const validatePassword = require('../src/Modules/passwordValidator');
//modules:
const quizController = require("./Modules/quizController");
const app = express();

const corsOptions = {
    origin: 'http://127.0.0.1:5500',
    optionsSuccessStatus: 200 // nogle legacy browsere (IE11, forskellige SmartTVs) kan ikke håndtere 204 
};

app.use(cors(corsOptions));
//Body-parser til url encoded requests
app.use(bodyParser.urlencoded({ extended: false }));
//Body-parser til json requests
app.use(bodyParser.json());
app.use(express.json());

//Lav endpoints her via app.get eller lignende
app.post("/signup", (req, res) => {
    const password = req.body.password;
    console.log(password);
    const validatePasswordStatus = validatePassword(password);
    if (!validatePasswordStatus) {
        console.log("Password does not meet requirements");
        res.status(400).json({ error: 'Adgangskoden opfylder ikke kravene.' });
    } else {
        console.log("Password meets requirements");
        res.send('Velkommen til');
    }
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
});

// Indlæs quizzer ved opstart
quizController.loadQuizzes();

// Endpoint for at få et tilfældigt spørgsmål
app.get("/quiz/get-question", quizController.getQuestion);

// Endpoint for at indsende svar på et spørgsmål
app.post("/quiz/submit-answer", quizController.submitAnswer);

// Endpoint for at få resultaterne af en quiz
app.get("/quiz/get-results", quizController.getResults);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});