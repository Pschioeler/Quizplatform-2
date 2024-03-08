//Brug express
const express = require('express');
//This is for JSON files
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());

//Body-parser til url encoded requests
app.use(bodyParser.urlencoded({ extended: false }));
//Body-parser til json requests
app.use(bodyParser.json());

// Rute til dit API-modul
app.get('/index', (req, res) => {
    const greeting = myModule.greet();
    res.json({ message: greeting });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});