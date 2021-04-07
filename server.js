'use strict';

require('dotenv').config();
// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg=require('pg');
const methodOverride=require('method-override');
// Application Setup
const app = express();
const PORT = process.env.PORT;



// Application Middleware
app.use(express.urlencoded({ extended: true }));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(methodOverride('_method'));

app.get('/', renderHomePage);

app.get('/searches/new', showForm);


// Creates a new search to the Google Books API
app.post('/searches', createSearch);
app.get('/books/:id',createbyId);
app.post('/books',handleSelect);



app.get('/edit/:id',handleData);
app.put('/edit/:id',handleUpdate);

app.delete('/books/:id',handleDelete);

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
  let SQL = 'SELECT book.id, author.name ,book.title,book.description ,book.image_url FROM book join author on book.author_id = author.id';
  client.query(SQL).then(data=>{
    // console.log(data);
    // console.log(data.rows);
    response.render('pages/index',{results:data.rows});
  });

}


// No API key required
// Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  // console.log('request.body',request.body);
  // console.log('request.body.search',request.body.search);

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  // console.log({url});

  superagent.get(url)
    .then(apiResponse => {
      // console.log('apiResponse.body', apiResponse.body);
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo));
    })
    .then(results => response.render('pages/show', { searchResults: results }))
    .catch((err)=> {
      response.render('pages/error', { error: err });
    });
  // how will we handle errors?
}


function createbyId(request,response){
  let SQL = `SELECT book.id, author.name ,book.title,book.description ,book.image_url FROM book join author on book.author_id = author.id WHERE book.id=$1`;
  // console.log(request.params);
  let vals=[request.params.id];
  client.query(SQL,vals).then(data=>{
    response.render('pages/books/show',{results:data.rows});
  }) .catch((err)=> {
    response.render('pages/error', { error: err });
  });
}


function handleSelect(request,response){
  console.log('request.body',request.body);
  let author = request.body.author;
  let sql2 = `SELECT * from author WHERE name=$1`;
  let sql = `INSERT INTO book (author_id,title,isbn,image_url,description) VALUES ($1,$2,$3,$4,$5) RETURNING * `;
  let newAutour = `INSERT INTO author(name) VALUES ($1) RETURNING *`;

  client.query(sql2, [author]).then(data => {
    // console.log(data.rows);
    if (data.rows.length > 0) {

      let values = [data.rows[0].id, request.body.title, request.body.isbn, request.body.image_url, request.body.description];
      client.query(sql, values).then((result) => {
        // console.log(result.rows);
      }).catch((err)=> {
        response.render('pages/error', { error: err });
      });
    } else {
      // console.log(newAutour);
      client.query(newAutour, [author]).then(data2 => {
        // console.log('newAutour',data2.rows);
        let vals=[data2.rows[0].id,request.body.title, request.body.isbn, request.body.imge_url, request.body.description];
        client.query(sql,vals).then((result) => {
        }).catch((err)=> {
          response.render('pages/error', { error: err });
        });
      }).catch((err)=> {
        response.render('pages/error', { error: err });
      });
    }
  }).catch((err)=> {
    response.render('pages/error', { error: err });
  });
  response.redirect('/');
}

function handleData(request,response){
  let SQL = `SELECT book.id, author.name ,book.title,book.description ,book.image_url FROM book join author on book.author_id = author.id WHERE book.id=$1`;
  let id= request.params.id;
  let vals=[id];
  client.query(SQL,vals).then(data=>{
    response.render('pages/books/edit',{results:data.rows[0]});
  });
}

function handleUpdate(request,response){
  let SQL ='UPDATE book SET title=$1, isbn=$2, image_url=$3, description=$4 WHERE id=$5';
  let {title,isbn,image_url,description}=request.body;
  let id= request.params.id;
  let vals=[title,isbn,image_url,description,id];

  client.query(SQL, vals).then(()=> {
    console.log('success!!!');
    response.redirect(`/books/${id}`);
  });
}

function handleDelete(request,response){
  const id=request.params.id;
  console.log('deleting',id);
  let SQL='DELETE FROM book WHERE id=$1;';
  let vals=[id];
  client.query(SQL,vals).then(()=>{
    response.redirect('/');
  });
}

// HELPER FUNCTIONS
// Only show part of this to get students started
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = info.title || 'No title available';
  // this.img = info.imageLinks || placeholderImage;
  this.authors = info.authors || 'No authors';
  this.description = info.description || 'No Description';
  this.isbn = (info.industryIdentifiers)?info.industryIdentifiers[0].identifier : 'not available';
  this.image_url = (info.imageLinks) ? info.imageLinks.thumbnail : placeholderImage;

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
