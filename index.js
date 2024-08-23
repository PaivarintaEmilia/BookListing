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

// Funktio datan hakemiseen databasesta
async function getBookData() {
  // Haetaan databasesta data
  const result = await db.query("SELECT * FROM books ORDER BY id ASC;");
  // Valitaan vain tarvittava tieto
  const data = result.rows;
  // Lähetetään data eteenpäin
  return data;
}

//app.get("/test", async (req, res) => {
//  const test = await getBookData();
//  console.log(test);
//  res.redirect("/");
//})

// Reitti, joka näyttää index.ejs-tiedoston
app.get("/", async (req, res) => {

  try {
    // Haetaan funktion takaa data
    const bookData = await getBookData();
    // Renderöidään alkunäyttö ja viedään sinne tarvittava data
    res.render("index.ejs", {
    bookList: bookData
  });

  } catch (error) {
    console.error("Error fetching items: ", error);
    res.status(500).send("Internal server error");
  }

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

});


// EDIT EXISTING DATA IN BOOK ITEM

// Kun käyttäjä on painanut edit-iconia
app.post("/edit/:id", async (req, res) => {
  // Renderöidään edit screeniin ja siirretään samalla eteenpäin tiedot

  // 1. tarvitaan id UI:n puolelta 
  const id = req.params.id;

  console.log(id); // Tulostaa 1

  // Tulee siis hakea dataa halutulla id:llä databasesta
  const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);

  console.log(result.rows); // Yhden kirjan tiedot

  res.render("addEditBook.ejs", {
    heading: "Edit the book",
    submit: "Save edits",
    books: result.rows
  });

});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
