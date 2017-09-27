DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS creators;
DROP TABLE IF EXISTS pledges;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS rewards;
DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
            id INT AUTO_INCREMENT,
            title VARCHAR(256) NOT NULL,
            subtitle VARCHAR(256),
            description TEXT,
            open BOOLEAN DEFAULT TRUE,
            target INT NOT NULL,
            ts DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
            PRIMARY KEY (id));

CREATE TABLE images (id INT AUTO_INCREMENT,
             projectid INT UNIQUE,
             image MEDIUMBLOB NOT NULL,
             type varchar(32) NOT NULL,
             PRIMARY KEY (id),
             FOREIGN KEY (projectid) REFERENCES projects(id));

CREATE TABLE users (id INT AUTO_INCREMENT,
             username VARCHAR(128) NOT NULL UNIQUE,
             location VARCHAR(256),
             email VARCHAR(128) NOT NULL UNIQUE,
             hash VARCHAR(512),
             salt VARCHAR(128),
             token VARCHAR(32) UNIQUE,
             deleted BOOLEAN DEFAULT FALSE,
             PRIMARY KEY (id),
             KEY (token));

CREATE TABLE creators (id INT AUTO_INCREMENT,
             projectid INT,
             userid INT,
             PRIMARY KEY(id),
             FOREIGN KEY (projectid) REFERENCES projects(id),
             FOREIGN KEY (userid) REFERENCES users(id));

CREATE TABLE rewards (id INT AUTO_INCREMENT,
             projectid INT,
             amount INT,
             description varchar(1024),
             PRIMARY KEY(id),
             FOREIGN KEY (projectid) REFERENCES projects(id));

 CREATE TABLE pledges (id INT AUTO_INCREMENT,
              projectid INT,
              userid INT,
              amount INT,
              anonymous BOOLEAN DEFAULT FALSE,
              cardToken VARCHAR(32),
              ts DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
              PRIMARY KEY(id),
              FOREIGN KEY (projectid) REFERENCES projects(id),
              FOREIGN KEY (userid) REFERENCES users(id));