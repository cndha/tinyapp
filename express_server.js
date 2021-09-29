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


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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

// app.get("/login", (req, res) => {

// });

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  // res.cookie('username', req.body.username);
  res.clearCookie('username');
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const username = req.cookies.username;
  const templateVars = { username, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(req.body);  
  res.redirect(`/urls/${shortURL}`);         
});


app.get("/urls/new", (req, res) => {
  const username = req.cookies.username;
  const templateVars = { username };
  // console.log(templateVars);
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const username = req.cookies.username;
  const templateVars = { username, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL", (req, res) => {
  const newLink = req.body.longURL;
  urlDatabase[req.params.shortURL] = newLink;
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

