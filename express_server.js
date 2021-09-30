const cookieSession = require("cookie-session");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { restart } = require("nodemon");

const app = express();
const PORT = 8080; 

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"],
}))

const generateRandomString = (length = 6) => {
  let result = '';
  let options = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < length; i++) {
    result += options.charAt(Math.floor(Math.random() * options.length));
  }
  return result;
};

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

const findUserByEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user
    }
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
  let result = {};

  for (let urls in urlDatabase) {
    if (urlDatabase[urls].userID === id) {
      result[urls] = { "longURL": urlDatabase[urls].longURL };
    }
  }
  return result;
}


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body</html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/register", (req, res) => {
  const user = req.session.user;
  const templateVars = { user };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  if (!email || !password) {
    return res.status(400).send("Email or password cannot be blank.");
  }

  let user = findUserByEmail(email);
  if (user) {
    return res.status(400).send("A user with that email already exists.");
  }

  const id = generateRandomString();
  user = { id , email, password: hashedPassword };
  users[id] = user;
  
  req.session.user = user.id;
  console.log(users);

  res.redirect("/urls");
});


app.get("/login", (req, res) => {
  const user = req.session.user;
  const templateVars = { user };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(403).send("Email or password cannot be blank.")
  }

  const user = findUserByEmail(email);
  console.log("user in POST login:", user);

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

app.get("/urls", (req, res) => {
  if (req.session.user === undefined) {
    res.status(401).send("Must login or register.")
  }

  const userId = req.session.user;
  const user = users[userId];
  const clientDatabase = urlsForUser(userId);
  const templateVars = { user, urls: clientDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect("/login", 401);
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user }; 
  res.redirect(`/urls/${shortURL}`);         
});


app.get("/urls/new", (req, res) => {
  const userId = req.session.user;
  const user = users[userId];
  const templateVars = { user };

  if (!user) {
    return res.redirect("/login", 401);

  } else {
    res.render("urls_new", templateVars);
  }

});


app.get("/urls/:shortURL", (req, res) => {
  const user = req.session.user;
  const templateVars = { user, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("You're not authorized to access this feature.")
  }

  const longURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = { longURL: longURL, userID: req.session.user };
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    return res.status(404).send("This url does not exist.")
  } 

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("You're not authorized to access this feature.")
  }

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

