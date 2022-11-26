const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");

require("dotenv").config();
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_PORT = process.env.DB_PORT;
const db = mysql.createPool({
  connectionLimit: 100,
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
});

db.getConnection((err, connection) => {
  if (err) throw err;
  console.log("DB connected successful: " + connection.threadId);
});

const port = process.env.PORT;
app.listen(port, () => console.log(`Server Started on port ${port}...`));

const bcrypt = require("bcrypt");
app.use(express.json());
app.use(cors());

app.get("/test", (req, res) => {
  const testData = "Hello";
  res.sendStatus(200).send(testData);
})

app.post("/createUser", async (req, res) => {
  const username = req.body.username;
  const fullName = req.body.fullName;
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  db.getConnection(async (err, connection) => {
    if (err) throw err;
    const sqlSearch = "SELECT * FROM userTable WHERE username = ?";
    const search_query = mysql.format(sqlSearch, [username]);
    const sqlInsert = "INSERT INTO userTable VALUES (0,?,?,?)";
    const insert_query = mysql.format(sqlInsert, [
      fullName,
      username,
      hashedPassword,
    ]);
    await connection.query(search_query, async (err, result) => {
      if (err) throw err;
      if (result.length != 0) {
        connection.release();
        res.sendStatus(409);
      } else {
        await connection.query(insert_query, (err, result) => {
          connection.release();
          if (err) throw err;
          res.sendStatus(201);
        });
      }
    });
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log('login was hit');
  db.getConnection(async (err, connection) => {
    if (err) throw err;
    const sqlSearch = "Select * from userTable where username = ?";
    const search_query = mysql.format(sqlSearch, [username]);
    await connection.query(search_query, async (err, result) => {
      connection.release();

      if (err) throw err;
      if (result.length == 0) {
        res.sendStatus(404);
      } else {
        const hashedPassword = result[0].password;
        const dataForLocalStorage = {
          fullName: result[0].fullName,
          userId: result[0].userId,
          username: result[0].username,
        };
        if (await bcrypt.compare(password, hashedPassword)) {
          res.send(dataForLocalStorage);
        } else {
          res.sendStatus(401);
        }
      }
    });
  });
});

app.post("/createLink", (req, res) => {
  const creatorId = req.body.creatorId;
  const url = req.body.url;
  const description = req.body.description;
  const timeCreated = req.body.timeCreated;
  const title = req.body.title;
  const creatorUsername = req.body.creatorUsername;
  db.getConnection(async (err, connection) => {
    if (err) throw err;
    const sqlInsert = "INSERT INTO linkTable VALUES (0,?,?,?,?,?,?)";
    const insert_query = mysql.format(sqlInsert, [
      creatorId,
      url,
      description,
      timeCreated,
      title,
      creatorUsername,
    ]);
    await connection.query(insert_query, (err, result) => {
      connection.release();
      if (err) throw err;
      res.sendStatus(201);
    });
  });
});

app.get("/linksById/:creatorId", (req, res) => {
  const creatorId = req.params.creatorId;
  db.getConnection(async (err, connection) => {
    if (err) throw err;
    const sqlSearch = "Select * from linkTable where creatorId = ?";
    const search_query = mysql.format(sqlSearch, [creatorId]);
    await connection.query(search_query, async (err, result) => {
      connection.release();
      if (err) throw err;
      if (result.length == 0) {
        res.sendStatus(404);
      } else {
        res.sendStatus(200).send(result);
      }
    });
  });
});

app.post("/search/:fullName", async (req, res) => {
  const fullName = req.params.fullName;
  db.getConnection(async (err, connection) => {
    if (err) throw err;
    const sqlSearch = "Select * from userTable where fullName = ?";
    const search_query = mysql.format(sqlSearch, [fullName]);
    await connection.query(search_query, async (err, result) => {
      connection.release();
      if (err) throw err;
      if (result.length == 0) {
        res.sendStatus(404);
      } else {
        if (result) {
          res.send(result);
        } else {
          res.sendStatus(401);
        }
      }
    });
  });
});

app.post("/follow", (req, res) => {
  const loggedInUserId = req.body.loggedInUserId;
  const userIdToFollow = req.body.userIdToFollow;
  db.getConnection(async (err, connection) => {
    if (err) throw err;
    const sqlInsert = "INSERT INTO followersTable VALUES (0, ?, ?)";
    const insert_query = mysql.format(sqlInsert, [
      loggedInUserId,
      userIdToFollow
    ]);
    await connection.query(insert_query, (err, result) => {
      connection.release();
      if (err) throw err;
      res.sendStatus(201);
    });
  });
});

app.get("/followers/:loggedInUserId", (req, res) => {
  const loggedInUserId = req.params.loggedInUserId;
  db.getConnection(async (err, connection) => {
    if (err) throw err;
    const sqlSearch = "Select * from followersTable where loggedInUserId = ?";
    const search_query = mysql.format(sqlSearch, [loggedInUserId]);
    await connection.query(search_query, async (err, result) => {
      connection.release();
      if (err) throw err;
      if (result.length == 0) {
        res.sendStatus(404);
      } else {
        const followers = result.length;
        res.send(`${followers}`);
      }
    });
  });
});


app.get("/following/:loggedInUserId", (req, res) => {
  const loggedInUserId = req.params.loggedInUserId;

  db.getConnection(async (err, connection) => {
    if (err) throw err;
    const sqlSearch = "Select * from followersTable where loggedInUserId = ?";
    const search_query = mysql.format(sqlSearch, [loggedInUserId]);
    await connection.query(search_query, async (err, result) => {
      connection.release();
      if (err) throw err;
      if (result.length === 0) {
        res.sendStatus(404);
      } else {
        const following = result.length;        
        res.send(`${following}`);
      }
    });
  });
});