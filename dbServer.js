const express = require("express")
const app = express()
const mysql = require("mysql")
require("dotenv").config()

const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

const bcrypt = require("bcrypt")

app.use(express.json())
//middleware to read req.body.<params>

//CREATE USER
app.post("/createuser", async (req,res) => {
    console.log("req.body: ", req.body);
    const user = req.body.name;
    console.log('req.body.password: ', req.body.password);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
        db.getConnection( async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "SELECT * FROM userTable WHERE user = ?"
    const search_query = mysql.format(sqlSearch,[user])
    const sqlInsert = "INSERT INTO userTable VALUES (0,?,?)"
    const insert_query = mysql.format(sqlInsert,[user, hashedPassword])
    // ? will be replaced by values
    // ?? will be replaced by string
    await connection.query (search_query, async (err, result) => {
     if (err) throw (err)
     console.log(result.length)
if (result.length != 0) {
    connection.release()
    console.log("------> User already exists")
    res.sendStatus(409) 
   } 
   else {
    await connection.query (insert_query, (err, result)=> {
    connection.release()
    if (err) throw (err)
    console.log ("--------> Created new User")
    console.log(result.insertId)
    res.sendStatus(201)
   })
  }
 }) //end of connection.query()
 }) //end of db.getConnection()
 }) //end of app.post()
 

const db = mysql.createPool({
   connectionLimit: 100,
   host: DB_HOST,
   user: DB_USER,
   password: DB_PASSWORD,
   database: DB_DATABASE,
   port: DB_PORT
})

const port = process.env.PORT
app.listen(port, 
()=> console.log(`Server Started on port ${port}...`))