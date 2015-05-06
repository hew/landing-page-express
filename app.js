var express       = require('express');
var $             = require('jquery');
var form          = require("express-form");
var bodyParser    = require('body-parser');
var html          = require('html');
var compression   = require('compression');
var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
                    require('dotenv').load();

/*
 * Start of the single page functionality. It's pretty simple:
 * We're using an instance of express to handle serving the 
 * files, routing, form validation, and form submission. 
 * 
 */


// Start the App.
var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// compress all requests - note must be before express.static
app.use(compression());

// Serve Static Content in /public folder
app.use(express.static(__dirname + '/public'));


// Enable CORS (More info: http://enable-cors.org/)
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Fire up a server on port 3000
var server = app.listen(process.env.PORT || 3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("App running at http://%s:%s", host, port);
});


/*
 * Start of the email functionality. It's pretty simple: 
 * When you hit the /contact route, grab the data from the form
 * and send email regarding form submission to the mail address.
 */

// Fire up a transporter object - for Mailgun in my case
var transporter = nodemailer.createTransport({
   service: "Mailgun",
   auth: {
     user: process.env.MG_USER,
     pass: process.env.MG_PASS
   }
});


// Initialize form vars 
var  field = form.field;

// Here's our route, and send email object.
app.post('/contact', 

         form( // Form filter and validation middleware
              field("name").trim().required(),
              field("email").trim().isEmail().required()
             ),

             function(req, res){

               if (!req.form.isValid) {
                 // Handle errors
                 console.log(req.form.errors);
                 res.status(500).send();

              } else {

               var mailOptions = {
                 from: 'Ape Conversion Inquiry:' + req.body.name + req.body.last + '<mailgun@sandbox7a868ae74ec14c9e99cb643b101cae0d.mailgun.org>',
                 to: 'mathujones@gmail.com',
                 subject: req.body.option,
                 text: 'From: ' + req.body.name + ' <' + req.body.email + '>\nmessage: ' + req.body.text
               };

               transporter.sendMail(mailOptions, function(error, info) {
                 if (error) {
                   console.log(error);
                   res.status(500).send({ 'error': error });
                 } else {
                   console.log('Message sent: ' + info.response);
                   res.send({ 'message': 'Message sent! ' + info.response });
                 }
               });

              }

             });

