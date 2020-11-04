var express = require('express');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
const mysql = require('mysql');
const helmet = require("helmet");
// to use env values
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database:'student_progress_indicator_database',
});
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
const KEY = "m yincredibl y(!!1!11!)<'SECRET>)Key'!";
var app = express();
app.use(express.json());
var bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }))
app.use(helmet());
app.post('/signup', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
  // in a production environment you would ideally add salt and store that in the database as well
  // or even use bcrypt instead of sha256. No need for external libs with sha256 though
  var password = crypto.createHash('sha256').update(req.body.password).digest('hex');
  console.log("hi");
  con.query("SELECT * FROM students WHERE username = ?", [req.body.username], function(err, row) {
    console.log(row.length);
    if(row.length!=0) {
      console.error("can't create user " + req.body.username);
      res.status(409);
      res.send("An user with that username already exists");
    } else {
      console.log("Can create user " + req.body.username);
      con.query("INSERT INTO students(`username`,`password`) VALUES (?, ?)", [req.body.username, password]);
      res.status(201);
      res.send("Success");
    }
  });
});

app.post('/login',function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
  console.log(req.body.username + " attempted login");
  var password = crypto.createHash('sha256').update(req.body.password).digest('hex');
  con.query("SELECT * FROM students WHERE (username, password) = (?, ?)", [req.body.username, password], function(err, row) {
    console.log(row.length);
    if(row.length!=0) {
      var payload = {
        username: req.body.username,
      };

      var token = jwt.sign(payload, KEY, {algorithm: 'HS256', expiresIn: "15d"});
      console.log("Success");
      res.send(token);
    } else {
      console.error("Failure");
      res.status(401)
      res.send("There's no user matching that");
    }
  });
});

app.get('/data', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
  var str = req.get('Authorization');
  try {
    jwt.verify(str, KEY, {algorithm: 'HS256'});
    res.send("Very Secret Data");
  } catch {
    res.status(401);
    res.send("Bad Token");
  }

});
app.post('/attendance',function(req, res) {
  console.log('hi');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 


con.query("INSERT INTO attendance(`studentid`,`date`,`status`) VALUES (?, ?,?)", [req.body.username, req.body.date,req.body.status]);
res.send("Success");
});

app.get('/getattendance',function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 

  return new Promise((resolve,reject) => {
    
    con.query("SELECT * FROM attendance WHERE `studentid`=?", [req.query.studentid],(err,results) =>{
    
      if(err){
       return reject(err);
      }
      else{
        res.json(results);
        return resolve(results);
        
        
        
        }
      });
    

    });  
});

let port = process.env.PORT || 3000;
app.listen(port, function () {
    return console.log("Started user authentication server listening on port " + port);
});
