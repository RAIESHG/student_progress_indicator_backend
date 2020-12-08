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
  con.query("SELECT * FROM student_information WHERE email = ?", [req.body.email], function(err, row) {
    console.log(row.length);
    if(row.length!=0) {
      console.error("can't create user " + req.body.email);
      res.status(409);
      res.send("An user with that email already exists");
    } else {
      console.log("Can create user " + req.body.email);
      con.query("INSERT INTO student_information(`studentname`,`class`,`section`,`email`,`phonenumber`) VALUES (?, ?,?,?,?)", [req.body.studentname,req.body._class,req.body.section,req.body.email,req.body.phonenumber,password]);
        res.status(201);
      res.send("Success");
    }
  });
});

app.post('/login',function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
  console.log(req.body.email + " attempted login");
  var password = crypto.createHash('sha256').update(req.body.password).digest('hex');
  con.query("SELECT * FROM student_information WHERE (email, password) = (?, ?)", [req.body.email, password], function(err, row) {
    console.log(row.length);
    if(row.length!=0) {
      var payload = {
        email: req.body.email,
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
app.post('/activity', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
// in a production environment you would ideally add salt and store that in the database as well
// or even use bcrypt instead of sha256. No need for external libs with sha256 though
console.log("hi");
con.query("INSERT INTO daily_activities(`date`,`attendance`,`notice`,`complain`,`studentid`) VALUES (?,?,?,?,?)", [req.body.date,req.body.attendance,req.body.notice,req.body.complain,req.body.studentid], function(err, row){
  res.status(201);
  res.send("Success");


});
});
app.post('/assignment', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
// in a production environment you would ideally add salt and store that in the database as well
// or even use bcrypt instead of sha256. No need for external libs with sha256 though
console.log("hi");
con.query("INSERT INTO assignment(`assignment`,`assigndate`,`duedate`) VALUES (?,?,?)", [req.body.assignment,req.body.assigndate,req.body.duedate], function(err, row){
  res.status(201);
  res.send("Success");
  con.query("INSERT INTO `student_assignment`(`studentid`, `subjectid`, `assignmentid`) SELECT studentid,(Select subjectid from subject where subjectname=?),(Select assignmentid from assignment where assignment=?) from student_information where section=? and class=?", [req.body.subject,req.body.assignment,req.body.section,req.body._class]);

});
});
app.post('/addsubject', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
// in a production environment you would ideally add salt and store that in the database as well
// or even use bcrypt instead of sha256. No need for external libs with sha256 though
console.log("hi");
con.query("INSERT INTO subject(`subjectname`) VALUES (?)", [req.body.subjectname], function(err, row){
  res.status(201);
  res.send("Success");
});
});





let port = process.env.PORT || 3000;
app.listen(port, function () {
    return console.log("Started user authentication server listening on port " + port);
});
