const { loadUsers, registerUser, loginUser } = require('./encryption.js');
const bcrypt = require('bcrypt');
//helper funktion for at finde den korrekte bruger
function findUser(username) {
    const users = loadUsers();
    const foundUser = users.find(user => {
        return bcrypt.compareSync(username, user.hashedUser);
    });
    return foundUser;
}
//funktion for at admins kan give adgang til grupper
function allowGroupAccess(groupId, username) {
    const foundUser = findUser(username);
    foundUser.groups.push({groupId: groupId, isAccepted: false});
    console.log(foundUser.groups);
//Hvordan kan vi skrive den i JSON filen uden at skulle overwrite hele filen???-----------------------------------
}
//funktion til at acceptere invitationer til grupper
function acceptGroupInvitation(groupId, user) {
    const foundGroup = user.groups.find(group => group.hasOwnProperty("groupId") && group.groupId === groupId);
    foundGroup.isAccepted = true;
}
//funktion se hvilke grupper brugeren er en del af
function checkUserGroups(username) {
    const user = findUser(username);
    return user.groups;
}
//funktion displaye tilgængelige quizzer (baseret på medlemskab)