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


app.post('/addstudent', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); 
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
  var password = crypto.createHash('sha256').update(req.body.password).digest('hex');
  con.query("SELECT * FROM student_information WHERE email = ?", [req.body.email], function(err, row) {
    console.log(row.length);
    if(row.length!=0) {
      console.error("can't create student " + req.body.email);
      res.status(409);
      res.send("An user with that email already exists");
    } else {
      console.log("Can create student " + req.body.email);
      con.query("INSERT INTO student_information(`studentname`,`class`,`section`,`email`,`phonenumber`,`password`) VALUES (?, ?,?,?,?,?)", [req.body.studentname,req.body._class,req.body.section,req.body.email,req.body.phonenumber,password]);
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
  con.query("SELECT studentid FROM student_information WHERE (email, password) = (?, ?)", [req.body.email, password], function(err, row) {
    console.log(row.length);
    if(row.length!=0) {
      var payload = {
        email: req.body.email,
      };

      var token = jwt.sign(payload, KEY, {algorithm: 'HS256', expiresIn: "15d"});
      console.log("Success");
      res.send(row);
    
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 

con.query("INSERT INTO daily_activities(`date`,`attendance`,`notice`,`complaines`,`studentid`) VALUES (?,?,?,?,?)", [req.body.date,req.body.attendance,req.body.notice,req.body.complain,req.body.studentid], function(err, row){
  res.status(201);

  res.send("Success");
});


});
app.post('/addassignment', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 

console.log("hi");
con.query("INSERT INTO assignment(`assignment`,`assigndate`,`duedate`) VALUES (?,?,?)", [req.body.assignment,req.body.assigndate,req.body.duedate], function(err, row){
  res.status(201);
  res.send("Success");
  con.query("INSERT INTO `student_assignment`(`studentid`, `subjectid`, `assignmentid`) SELECT studentid,(Select subjectid from subject where subjectname=?),(Select assignmentid from assignment where assignment=? and assigndate=?) from student_information where section=? and class=?", [req.body.subject,req.body.assignment,req.body.assigndate,req.body.section,req.body._class]);

});
});
app.post('/addresult', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 

console.log("hi");
con.query("INSERT INTO student_result(`grades`,`subject`,`studentid`,`date`) VALUES (?,?,?,?)", [req.body.grade,req.body.subject,req.body.studentid,req.body.date], function(err, row){
  res.status(201);
  res.send(err);

});
});
app.post('/addsubject', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); 
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
console.log("hi");
con.query("INSERT INTO subject(`subjectname`) VALUES (?)", [req.body.subjectname], function(err, row){
  res.status(201);
  res.send("Success");
});
});

app.get('/getactivity', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
// in a production environment you would ideally add salt and store that in the database as well
// or even use bcrypt instead of sha256. No need for external libs with sha256 though
console.log("hi");
  try{
    res.statusCode = 200;
    con.query("SELECT * FROM `daily_activities` WHERE studentid=? and date like '%' ? '%'",[req.query.studentid,req.query.date],(err,results) => {

    res.json(results);});

}

catch(e){
    console.log("some error");
    console.log(e);
    res.sendStatus(500);
}
});
app.get('/getresult', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
// in a production environment you would ideally add salt and store that in the database as well
// or even use bcrypt instead of sha256. No need for external libs with sha256 though
console.log("hi");
  try{
    res.statusCode = 200;
    con.query("SELECT * FROM `student_result` WHERE studentid=? and date like '%' ? '%'",[req.query.studentid,req.query.date],(err,results) => {

    res.json(results);});

}

catch(e){
    console.log("some error");
    console.log(e);
    res.json(err);
    res.sendStatus(500);
}
});



app.get('/getassignment', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
// in a production environment you would ideally add salt and store that in the database as well
// or even use bcrypt instead of sha256. No need for external libs with sha256 though
console.log("hi");
  try{
    res.statusCode = 200;
    con.query("SELECT * from assignment,subject where assignmentid IN(Select assignmentid from student_assignment where studentid=?) and duedate like '%' and assigndate like '%' ? '%' and subjectname = (Select subjectname from subject where subjectid IN(Select subjectid from student_assignment where studentid=?))",[req.query.studentid,req.query.assigndate,req.query.studentid],(err,results) => {
    //http://localhost:3000/getassignment?assigndate=2020-02-02 postmanquery
      res.json(results);});
    }
catch(e){
    console.log("some error");
    console.log(e);
    res.sendStatus(500);}});

app.get('/getstudentinformation', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); 
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 

  try{
    res.statusCode = 200;
    con.query("SELECT * from `student_information` where `studentid`=?",[req.query.studentid],(err,results) => {
    res.json(results);});
  }

catch(e){
    console.log("some error");
    console.log(e);
    res.sendStatus(500);
}});

app.get('/getprogress', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
// in a production environment you would ideally add salt and store that in the database as well
// or even use bcrypt instead of sha256. No need for external libs with sha256 though
console.log("hi");
  try{
    res.statusCode = 200;
    con.query("Select (SELECT COUNT(*) from daily_activities where studentid=? and attendance='present')/(SELECT COUNT(*) from daily_activities where studentid=? )*100 as attendance, (Select SUM(grades) from student_result where studentid=?)/(SELECT COUNT(*) from student_result where studentid=? ) as averagegrade, (SELECT COUNT(*) from daily_activities where studentid=? and complaines='-')/(SELECT COUNT(*) from daily_activities where studentid=? and attendance='present')*100 as complaines from daily_activities,student_result GROUP by attendance,student_result.studentid",[req.query.studentid,req.query.studentid,req.query.studentid,req.query.studentid,req.query.studentid,req.query.studentid],(err,results) => {

    res.json(results);});

}
catch(e){
    console.log("some error");
    console.log(e);
    res.sendStatus(500);
}
});
app.get('/getstudents', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); 
// in a production environment you would ideally add salt and store that in the database as well
// or even use bcrypt instead of sha256. No need for external libs with sha256 though
console.log("hi");
  try{
    res.statusCode = 200;
    con.query("Select studentname,studentid from student_information where class=? and section=?",[req.query.classs,req.query.section],(err,results) => {

    res.json(results);});

}
catch(e){
    console.log("some error");
    console.log(e);
    res.sendStatus(500);
}
});


let port = process.env.PORT || 3000;
app.listen(port, function () {
    return console.log("Started user authentication server listening on port " + port);
});
