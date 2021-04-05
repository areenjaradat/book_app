// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg=require('pg');
// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;



// Application Middleware
app.use(express.urlencoded({ extended: true }));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

app.get('/', renderHomePage);

app.get('/searches/new', showForm);


// Creates a new search to the Google Books API
app.post('/searches', createSearch);
app.get('/books/:id',createbyId);
app.post('/books',handleSelect);

app.use(express.static('./public'));

app.get('*', (request, response) => response.status(404).send('This route does not exist'));


app.use('*', notFoundHandler); // 404 not found url

app.use(errorHandler);

const client = new pg.Client(process.env.DATABASE_URL);


function showForm(request, response) {
  console.log('inside of searches!!');
  response.render('pages/searches/new');
}

function renderHomePage(request, response) {
  // console.log('inside home page');
  // response.render('pages/index');

  // let SQL='INSERT INTO book (title,author, isbn, image_url, description)VALUES($1,$2,$3,$4,$5)';
  // let VALUES=['Dune', 'Frank Herbert', 'ISBN_13 9780441013593', 'http://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api', 'Follows the adventures of Paul Atreides, the son of a betrayed duke given up for dead on a treacherous de'];
  let SQL =`SELECT * FROM book;`;
  client.query(SQL).then(data=>{
    console.log(data);
    console.log(data.rows);
    response.render('pages/index',{results:data.rows});
  });

}


// No API key required
// Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  console.log('request.body',request.body);
  console.log('request.body.search',request.body.search);

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  console.log({url});

  superagent.get(url)
    .then(apiResponse => {
      console.log('apiResponse.body', apiResponse.body);
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo));
    })
    .then(results => response.render('pages/show', { searchResults: results }))
    .catch((err)=> {
      response.render('pages/error', { error: err });
    });
  // how will we handle errors?
}


function createbyId(request,response){
  let SQL='SELECT * FROM book WHERE id=$1;';
  console.log(request.params);
  let vals=[request.params.id];
  client.query(SQL,vals).then(data=>{
    response.render('pages/books/show',{results:data.rows});
  }) .catch((err)=> {
    response.render('pages/error', { error: err });
  });
}


function handleSelect(request,response){
  let book=request.body;
  console.log(request.body);
  let SQL='INSERT INTO book (title,author,isbn,image_url,description) VALUES ($1, $2, $3, $4, $5) RETURNING id;';
  let val=[book.title,book.author,book.isbn,book.image_url,book.description];
  client.query(SQL,val).then(results=>{
    response.redirect(`/books/${results.rows[0].id}`);
  }) .catch((err)=> {
    response.render('pages/error', { error: err });
  });
}


// HELPER FUNCTIONS
// Only show part of this to get students started
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = info.title || 'No title available';
  this.img = info.imageLinks || placeholderImage;
  this.authors = info.authors || 'No authors';
  this.description = info.description || 'No Description';
  this.isbn = info.industryIdentifiers[0].identifier || 'not available';
}

function notFoundHandler(request, response) {
  response.status(404).send('requested API is Not Found!');
}

function errorHandler(err, request, response) {
  response.status(500).send('something is wrong in server');
}

client.connect().then(()=>{
  app.listen(PORT, () => {console.log(`Listening to Port ${PORT}`);});
});
