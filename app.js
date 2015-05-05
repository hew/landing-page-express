var express       = require('express');
var $             = require('jquery');
var form          = require("express-form");
var bodyParser    = require('body-parser');
var html          = require('html');
var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
                    require('dotenv').load();






/*
 * Start of the static HTML functionality. 
 * We're using Express to handle serving the 
 * content located in the /public directory.
 */


// Start the App.
var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

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
 * and after validation, send email regarding form submission to
 * the mail address.
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
var field = form.field;

// Here's our route, and send email object.
app.post('/contact', 

         form( // Form filter and validation middleware.
              field("name").trim().required(),
              field("email").trim().isEmail().required()
             ),

             function(req, res){  

               if (!req.form.isValid) {
                 // Server-side error handling 
                 console.log(req.form.errors);

                 // Client-side error handling
                 res.status(500).send();
                  /*
                   * So this is the key line here. Let me take a second to walk you through this.
                   * Status code 500 basically means 'internal error' which is what we want to 
                   * send back to the client - and then cause a jQuery event or something. Informing
                   * the user to fill out the form properly. If you want, you can pipe through the actual
                   * error message from the validator. See the docs.
                   */

              } else { // OK, cool, validation complete. Package up the form info into a nice object.

               var mailOptions = {
                 from: 'Hummus Delivery from:' + req.body.name + req.body.last + '<mailgun@sandboxhummmmmuuuuussssss.mailgun.org>',
                 to: 'mmm@hummus.com',
                 subject: req.body.option,
                 text: 'From: ' + req.body.name + ' <' + req.body.email + '>\nmessage: ' + req.body.text
               };

               transporter.sendMail(mailOptions, function(error, info) { // and then attempt to send that object.
                 if (error) {
                   console.log(error);
                   res.status(500).send({ 'error': error }); 
                    /*
                     * As mentioned above, here we supply a message to clarify the nature of the error. 
                     * You might decide to do this with the email object as opposed to the form because a 
                     * lot of the time form validation to the user will just be the field turning red or something.
                     */

                 } else {                                   
                   console.log('Message sent: ' + info.response);
                   res.send({ 'message': 'Message sent! ' + info.response }); // Let 'em know that all is good. We're done here on the server.
                 }
               });

              }

             });

