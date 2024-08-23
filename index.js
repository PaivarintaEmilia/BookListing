import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config(); // Lataa ympäristömuuttujat .env-tiedostosta

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Yhdistetään tietokantaan käyttäen ympäristömuuttujia
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

// Reitti, joka näyttää index.ejs-tiedoston
app.get("/", (req, res) => {
  res.render("index.ejs");
});


// ADD NEW BOOK

// Routes to render the edit page
app.get("/new", (req, res) => {
  res.render("addEditBook.ejs", { heading: "New book", submit: "Add a new book" });
});


// Uuden kirjan lisäyksen submitin jälkeiset toimet
app.post("/newBook", async (req, res) => {

  // Mitä tapahtuu, kun halutaan lisätä uusi kirja?

  // 1. Haetaan tiedot newBookFormista
  const newTitle = req.body.title;
  const newRating = req.body.rating;
  const newDate = req.body.date;
  const newContent = req.body.content;


  // 2. Lisätään tiedot tietokantaan
  const result = await db.query("INSERT INTO books (title, rating, data, content) VALUES ($1, $2, $3, $4) RETURNING *", 
    [newTitle, newRating, newDate, newContent]
  );

  console.log(result.rows);
  // 3. Siirrytään takaisin etusivulle
  res.redirect("/");

})



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
