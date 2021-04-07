DROP TABLE IF EXISTS author;

CREATE TABLE IF NOT EXISTS author (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

INSERT INTO author (name) SELECT DISTINCT author FROM book; 
-- i did it in the terminal
 ALTER TABLE book ADD COLUMN author_id INT;
UPDATE book SET author_id=author.id FROM (SELECT * FROM author) AS author WHERE book.author = author.name;
 ALTER TABLE book DROP COLUMN author;
ALTER TABLE book ADD CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES author(id);