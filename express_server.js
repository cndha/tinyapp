const cookieSession = require("cookie-session");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { restart } = require("nodemon");
const { getUserByEmail, generateRandomString } = require("./helpers");

const app = express();
const PORT = 8080; 

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"],
}))


const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com",
    password: "$2a$10$gr2qnjK9AMjHyqkPZ9lCteEL3jI11Yp9PJqgjfq28Wirzp1w1TG.e"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$iXS46KnTdnbDn9qowEUrheuivcZff4kxOweMkmDr3hmxcHOAjhIUK"
  },
  "random3": {
    id: "random3",
    email: "cindy@cindy.com",
    password: "$2a$10$K9OY.rhUoo/Uy4y/LYBQpuGv5ch.KRvUzE099miU8JLz1Ah.ux2Ha"
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "random3"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

const urlsForUser = (id) => {
  const results = {};

  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      results[shortURL] = { "longURL": urlDatabase[shortURL].longURL };
    }
  }
  return results;
};

// GET
app.get("/", (req, res) => {
  const userId = req.session.user;
  const user = users[userId];
  if (!user) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  const user = req.session.user;
  const templateVars = { user };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const user = req.session.user;
  const templateVars = { user };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => {
  if (req.session.user === undefined) {
    return res.status(401).send("Must login or register.")
  }

  const userId = req.session.user;
  const user = users[userId];
  const clientDatabase = urlsForUser(userId);
  const templateVars = { user, urls: clientDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user;
  const user = users[userId];
  const templateVars = { user };
  
  if (!user) {
    return res.redirect("/login");
  } 
  
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.session.user !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("You're not authorized to access this feature.")
  }

  const userId = req.session.user;
  const user = users[userId];
  const templateVars = { user, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    return res.status(404).send("This url does not exist.")
  } 

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//POST

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  if (!email || !password) {
    return res.status(400).send("Email or password cannot be blank.");
  }

  let user = getUserByEmail(email, users);
  if (user) {
    return res.status(400).send("A user with that email already exists.");
  }

  const id = generateRandomString();
  user = { id , email, password: hashedPassword };
  users[id] = user;
  
  req.session.user = user.id;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(403).send("Email or password cannot be blank.")
  }

  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send("User does not exist.")
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Password does not match.")
  }

  req.session.user = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect("/login").status(401);
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user }; 
  res.redirect(`/urls/${shortURL}`);         
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("You're not authorized to access this feature.")
  }

  const longURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = { longURL: longURL, userID: req.session.user };
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("You're not authorized to access this feature.")
  }

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

