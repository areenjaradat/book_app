// Application Dependencies
const express = require('express');
const superagent = require('superagent');

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

app.use(express.static('./public'));

app.get('*', (request, response) => response.status(404).send('This route does not exist'));


app.use('*', notFoundHandler); // 404 not found url

app.use(errorHandler);



function showForm(request, response) {
  console.log('inside of searches!!');
  response.render('pages/searches/new');
}

function renderHomePage(request, response) {
  console.log('inside home page');
  response.render('pages/index');
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
      response.render('pages/error', { error: 'sorry we have a problem' });
    });
  // how will we handle errors?
}

// HELPER FUNCTIONS
// Only show part of this to get students started
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = info.title || 'No title available';
  this.img = info.imageLinks || placeholderImage;
  this.title = info.title;
  this.authors = info.authors.join(',');
  this.description = info.description || 'No Description';

}

function notFoundHandler(request, response) {
  response.status(404).send('requested API is Not Found!');
}

function errorHandler(err, request, response) {
  response.status(500).send('something is wrong in server');
}

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
