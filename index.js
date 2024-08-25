import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import axios from "axios";
import { format } from 'date-fns';


dotenv.config(); // Lataa ympäristömuuttujat .env-tiedostosta

const app = express();
const port = 3000;
const API_URL = "https://covers.openlibrary.org/b/isbn/"; 

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


// Function for getting book items data
async function getBookData() {

  // Get book data
  const result = await db.query("SELECT * FROM books ORDER BY id ASC;");
  const data = result.rows;


  const apiPromises = data.map(async (row) => {

    // Build the apiUrl
    const apiUrl = `${API_URL}${row.cover}-M.jpg`;

    // Api query
    const apiResponse = await axios.get(apiUrl);

    return apiResponse.config.url;

  
  });


  // Wait for API requests and add data to array coverUrls
  const coverUrls = await Promise.all(apiPromises);


  // Combine data and coverUrls
  const combinedData = data.map((book, index) => {
    return {
      ...book,          // Lisää kaikki book-objektin kentät
      coverUrl: coverUrls[index] // Lisää coverData-taulukon vastaava URL
    };
  });

  return combinedData;

};

// Home screen route
app.get("/", async (req, res) => {

  try {

    const bookData = await getBookData();

    // Format date data
    const formattedBookData = bookData.map(book => {
      return {
        ...book,
        data: format(new Date(book.data), 'yyyy-MM-dd')
      };
    });


    // Render index.ejs and pass the book data
    res.render("index.ejs", {
    bookList: formattedBookData
  });

  } catch (error) {
    console.error("Error fetching items: ", error);
    res.status(500).send("Internal server error");
  }

});


// ADD NEW BOOK

// Routes to render the new book screen
app.get("/new", (req, res) => {
  res.render("addEditBook.ejs", { heading: "New book", submit: "Add a new book" });
});


// Uuden kirjan lisäyksen submitin jälkeiset toimet
app.post("/newBook", async (req, res) => {


  // 1. Haetaan tiedot newBookFormista
  const newTitle = req.body.title;
  const newRating = req.body.rating;
  const newDate = req.body.date;
  const newContent = req.body.content;
  const newCover = req.body.cover;


  // 2. Lisätään tiedot tietokantaan
  const result = await db.query("INSERT INTO books (title, rating, data, content, cover) VALUES ($1, $2, $3, $4, $5) RETURNING *", 
    [newTitle, newRating, newDate, newContent, newCover]
  );

  // 3. Siirrytään takaisin etusivulle
  res.redirect("/");

});


// EDIT EXISTING DATA IN BOOK ITEM

// Kun käyttäjä on painanut edit-iconia
app.post("/edit/:id", async (req, res) => {
  // Renderöidään edit screeniin ja siirretään samalla eteenpäin tiedot

  // 1. tarvitaan id UI:n puolelta 
  const id = req.params.id;

  // Tulee siis hakea dataa halutulla id:llä databasesta
  const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);

  res.render("addEditBook.ejs", {
    heading: "Edit the book",
    submit: "Save edits",
    books: result.rows
  });

});


// Kun käyttäjä on täyttänyt muokattavat tiedot ja submittanut editForm lomakkeen
app.post("/bookEdit/:id", async (req, res) => {

  const id = req.params.id;

  // Haetaan tarvittava data
  const editTitle = req.body.title;
  const editRating = req.body.rating;
  const editDate = req.body.date;
  const editContent = req.body.content;
  const editCover = req.body.cover;

  // Muokataan tiedot databaseen
  await db.query("UPDATE books set title = $1, rating = $2, data = $3, content = $4, cover = $5 WHERE id = $6",
    [editTitle, editRating, editDate, editContent, editCover, id]
  );

  // 3. Siirrytään takaisin etusivulle
  res.redirect("/");

})


// KIRJAN POISTAMINEN LISTALTA
// DELETE reitti, joka poistaa kirjan ID:n perusteella
app.delete('/delete/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const result = await db.query("DELETE FROM books WHERE id = $1", [id]);
    
    if (result.rowCount > 0) {
      res.status(200).send('Poisto onnistui');
    } else {
      res.status(404).send('Itemiä ei löytynyt');
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).send('Virhe poistettaessa itemiä');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
