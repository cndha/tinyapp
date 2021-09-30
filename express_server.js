const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
const app = express();
const PORT = 8080; 

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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
    password: "purplemonkey"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "yellowturtle"
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

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};


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
  const user = req.cookies.user;
  const templateVars = { user };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password; 

  if (!email || !password) {
    return res.status(400).send("Email or password cannot be blank.");
  }

  let user = findUserByEmail(email);
  if (user) {
    return res.status(400).send("A user with that email already exists.");
  }

  const id = generateRandomString();
  user = { id , email, password };
  users[id] = user;

  res.cookie("user", { id: user.id, email: user.email });
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const user = req.cookies.user;
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

  if (!user) {
    return res.status(403).send("No user with that email exists.")
  }

  if (user.password !== password) {
    return res.status(403).send("Password does not match.")
  }

  res.cookie("user", { id: user.id, email: user.email })

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user');
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const user = req.cookies.user;
  const templateVars = { user, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user = req.cookies.user;
  if (!user) {
    return res.redirect("/login", 401);
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies.user }; 
  res.redirect(`/urls/${shortURL}`);         
});


app.get("/urls/new", (req, res) => {
  const user = req.cookies.user;
  const templateVars = { user };

  if (!user) {
    return res.redirect("/login", 401);

  } else {
    res.render("urls_new", templateVars);
  }

});


app.get("/urls/:shortURL", (req, res) => {
  const user = req.cookies.user;
  const templateVars = { user, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = { longURL: longURL, userID: req.cookies.user };
  res.redirect(`/urls/${req.params.shortURL}`);
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

