const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const usersFilePath = '../DB/users.json';
// Feljhåndtering
function handleError(res, errorMessage) {
    console.error(errorMessage);
    res.status(500).send('Der er sket en fejl. Venligst prøv igen.');
}
// Tjek om filen eksisterer og loader brugere
let users = {};
try {
    const data = fs.readFileSync(usersFilePath);
    users = JSON.parse(data);
} catch (error) {
    if (error.code === 'ENOENT') {
        fs.writeFileSync(usersFilePath, JSON.stringify({}));
    } else {
        console.error('Error reading users file:', error);
    }
}

// Endpoint for registrering
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (users[username]) {
            return res.status(400).send('Brugernavn er allerede i brug');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        users[username] = { salt, password: hashedPassword, isAdmin: false, isSuperAdmin: false, timelogs: [] };
        fs.writeFile(usersFilePath, JSON.stringify(users), (err) => {
            if (err) {
                return handleError(res, 'Fejl ved skrivning af brugere til fil');
            }
            res.status(201).send('Bruger oprettet!');
        });
    } catch (error) {
        handleError(res, error.message);
    }
});
// Endpoint for login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users[username];
        const errorMessage = 'Brugernavn eller kodeord er forkert. Venligst prøv igen.';
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send(errorMessage);
        }
        res.status(200).send('Login vellykket');
    } catch (error) {
        handleError(res, error.message);
    }
});
