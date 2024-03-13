const { loadUsers } = require('./encryption.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const usersFilePath = path.join(__dirname, '../DB/users.json');
const groupsFilePath = path.join(__dirname, '../DB/groups.json');

//helper funktion for at finde den korrekte bruger
function findUser(username) {
    const users = loadUsers();
    const foundUser = users.find(user => {
        return bcrypt.compareSync(username, user.hashedUser);
    });
    if (!foundUser) {
        throw new Error(`Bruger '${username}' blev ikke fundet.`);
    }
    return foundUser;
}
//helper funktion
function saveUsers(users) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error ved skrivning i filen:', error);
    }
}
//helper funktion
function loadGroups() {
    try {
        const data = fs.readFileSync(groupsFilePath);
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            fs.writeFileSync(groupsFilePath, JSON.stringify([]));
            return [];
        } else {
            console.error('Error reading groups file:', error);
            return [];
        }
    }
}
//funktion til at oprette ny grupper
function createGroup(groupId, groupName, availableQuizzes, members) {

}
//funktion for at admins kan give adgang til grupper
function allowGroupAccess(groupId, username) {
    const foundUser = findUser(username);
    // Kontroller om brugeren allerede er tilmeldt til den givne gruppe
    const existingGroup = foundUser.groups.find(group => group.groupId === groupId);
    if (existingGroup) {
        throw new Error(`'${username}' har allerede adgang til gruppen med ID '${groupId}'.`);
    }
    foundUser.groups.push({groupId: groupId, isAccepted: false});
     let users = loadUsers();
     // Find og opdater brugeren i arrayet
     const userIndex = users.findIndex(user => user.username === username);
     if (userIndex !== -1) {
         users[userIndex] = foundUser;
     } else {
         console.error(`User '${username}' not found.`);
         return;
     }
     // Gem den opdateret version
     saveUsers(users);
    console.log(foundUser.groups);
}
//funktion til at acceptere invitationer til grupper
function acceptGroupInvitation(groupId, username) {
    const user = findUser(username);
    const foundGroup = user.groups.find(group => group.hasOwnProperty("groupId") && group.groupId === groupId);
    if (!foundGroup) {
        throw new Error(`Gruppen med ID '${groupId}' blev ikke fundet.`);
    }
    foundGroup.isAccepted = true;
    console.log(user.groups);
    let users = loadUsers();
    const userIndex = users.findIndex(user => user.username === username);
    if (userIndex !== -1) {
        users[userIndex] = user;
    } else {
        console.error(`User '${username}' not found.`);
        return;
    }
    saveUsers(users);
}
//funktion se hvilke grupper brugeren er en del af
function checkUserGroups(username) {
    try {
        const user = findUser(username);
        console.log(user.groups);
        return user.groups;
    } catch (error) {
        console.error(error.message);
        // returnerer tom array hvis der er ingen grupper
        return [];
    }
}
//findUser("maja");
//allowGroupAccess(1, "test");
//checkUserGroups("test");
//acceptGroupInvitation(3, "test");
//allowGroupAccess(1, "test");

//funktion displaye tilgængelige quizzer (baseret på medlemskab)
