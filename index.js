const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for 
                                                            // our purposes we'll hash these existing users when the 
                                                            // app loads
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user", // Regular user
    },
];

// POST /logout - Logs out the user
app.post("/logout", (request, response) => {
    request.session.destroy();
    response.redirect("/");
});

// GET /login - Render login form
app.get("/login", (request, response) => {
    const errorMsg = request.query.error || null;
    response.render("login", { errorMsg });
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    const {email, password} = request.body;
    const user = USERS.find((user) => user.email === email);

    // if correct user and password go to landing page
    if (!!user && bcrypt.compareSync(password, user.password)) {
        request.session.username = user.username;
        request.session.role = user.role;
        request.session.email = user.email;
        return response.redirect("/landing");
    }

    // Incorrect user and password
    return response.status(400).render("login", { 
        errorMsg: "Incorrect email or password" 
    });
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    const errorMsg = request.query.error || null;
    response.render("signup", { errorMsg });
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    const {username, email, password} = request.body;

    // Validations
    if (USERS.find((user) => user.username === username)) {
        return response.status(400).render("signup", {
            errorMsg: "Username already exists",
        });
    } else if (USERS.find((user) => user.email === email)) {
        return response.status(400).render("signup", {
            errorMsg: "Email already exists",
        });
    }

    // Add user to USERS array
    USERS.push({
        username,
        password: bcrypt.hashSync(password, SALT_ROUNDS),
        email,
        role: "user",
    });
    console.log("User added successfully");
    return response.redirect("/");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    const userEmail = request.session.email;
    const errorMsg = request.query.error || null;

    if (request.session.username) {
        return response.redirect("/landing");
    }
    response.render("index", { userEmail, errorMsg });
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
    const username = request.session.username;
    const role = request.session.role;

    // Admin role
    if (role === "admin") {
        return response.render("landing", {username, users: USERS});
    }

    // user role
    return response.render("landing", { username, users: null });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
