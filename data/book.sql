DROP TABLE IF EXISTS book;

CREATE TABLE IF NOT EXISTS book (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
     author_id INT, 
    isbn VARCHAR(255),
    image_url VARCHAR(255),
    description TEXT
);
CREATE TABLE author (id SERIAL PRIMARY KEY, name VARCHAR(255));
ALTER TABLE book ADD CONSTRAINT fk_authors FOREIGN KEY (author_id) REFERENCES author(id);