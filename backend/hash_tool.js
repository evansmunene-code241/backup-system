// hash_tool.js
const bcrypt = require("bcryptjs");

const password = "AdminPass123"; // ⚠️ Change this to your desired password!
const saltRounds = 10; 

const hash = bcrypt.hashSync(password, saltRounds);

console.log("Password:", password);
console.log("-----------------------------------------");
console.log("Your Bcrypt Hash (COPY THIS):");
console.log(hash);