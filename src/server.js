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
const { registerUser, loginUser} = require('../src/Modules/encryption');
const app = express();

app.use(cors());
//Body-parser til url encoded requests
app.use(bodyParser.urlencoded({ extended: false }));
//Body-parser til json requests
app.use(bodyParser.json());
app.use(express.json());

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