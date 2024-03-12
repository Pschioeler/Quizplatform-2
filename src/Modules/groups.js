const { loadUsers, registerUser, loginUser } = require('./encryption.js');
const bcrypt = require('bcrypt');
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
//funktion for at admins kan give adgang til grupper
function allowGroupAccess(groupId, username) {
    const foundUser = findUser(username);
    // Kontroller om brugeren allerede er tilmeldt til den givne gruppe
    const existingGroup = foundUser.groups.find(group => group.groupId === groupId);
    if (existingGroup) {
        throw new Error(`Gruppen med ID '${groupId}' eksisterer allerede for bruger '${username}'.`);
    }
    foundUser.groups.push({groupId: groupId, isAccepted: false});
    console.log(foundUser.groups);
//Hvordan kan vi skrive den i JSON filen uden at skulle overwrite hele filen???-----------------------------------
}
//funktion til at acceptere invitationer til grupper
function acceptGroupInvitation(groupId, user) {
    const foundGroup = user.groups.find(group => group.hasOwnProperty("groupId") && group.groupId === groupId);
    if (!foundGroup) {
        throw new Error(`Gruppen med ID '${groupId}' blev ikke fundet.`);
    }
    foundGroup.isAccepted = true;
}
//funktion se hvilke grupper brugeren er en del af
function checkUserGroups(username) {
    try {
        const user = findUser(username);
        return user.groups;
    } catch (error) {
        console.error(error.message);
        // returnerer tom array hvis der er ingen grupper
        return [];
    }
}

//funktion til at gemme dataen???-----------------------------------------
//funktion displaye tilgængelige quizzer (baseret på medlemskab)
