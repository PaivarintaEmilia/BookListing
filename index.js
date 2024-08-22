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

//db.connect();

// Loput koodista pysyy ennallaan...


// Reitti, joka näyttää index.ejs-tiedoston
app.get("/", (req, res) => {
  res.render("addEditBook.ejs");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
