//Brug express
const express = require('express');
//This is for JSON files
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const validatePassword = require('../src/Modules/passwordValidator');
const app = express();
//brug moduler ved: const myModule = require('./modules/myModule');

app.use(cors());

//Body-parser til url encoded requests
app.use(bodyParser.urlencoded({ extended: false }));
//Body-parser til json requests
app.use(bodyParser.json());

app.use(express.json());

//Lav endpoints her via app.get eller lignende
app.post('/signup', (req, res) => {
    const password = req.body.password;
    const validatePasswordStatus = validatePassword(password);
    if (!validatePasswordStatus) {
        console.log("Password does not meet requirements");
        res.status(400).json({ error: 'Adgangskoden opfylder ikke kravene.' });
    } else {
        console.log("Password meets requirements");
        res.send('Velkommen til');
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});