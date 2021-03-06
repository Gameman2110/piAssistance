//Server script for the voice recognition and searching in database for solutions.


const client = require('socket.io').listen(8000).sockets; //Requires socket.io and starts listening for open connections
const fs = require('fs'); //Getting the filesystem
const removeWhitespace = require('remove-whitespace'); //Getting the remove-whitespace api for sending email and dealing with strings.
const weather = require('weather-js'); //Getting weather api for checking weather.
const mongo = require('mongodb').MongoClient;
const wiki = require('wtf_wikipedia');

//FOR SPECIAL COMMANDS FOR THE BOT
const clientConfig  = require('../clientConfig.json');

//You can add you own commands to the file (Comming soon!)
var installed = false;
console.log('Weather node started up.');

console.log('Server for piAssistance voice recognition bot is running...'); //Start of bot.
console.log('Packages were successfully started & running.'); //Start of bot.
mongo.connect("mongodb://127.0.0.1/piAssistance", function(err, db){

    //Sets up database variables
    let piDB = db.collection('piAssistance');
client.on('connection', function(socket){ //If we get a connection.
    console.log('A connection was made to the server.')
    socket.on('input', function(data){ //If we get an input from client

        //Setting up variables to handle the input given by the client.
        var edit = data.final.toLowerCase();
        var trim = edit.trim();
        var req = trim;
        
        req.toString();
        console.log('Client sent message: ' + req); //Logs what message that was sent from the client connected to the server.
        var n = req.includes("what's");
        //Checks if we should add something into the database.
        if (req == 'weather' || req == "what's the weather" || req == "what's the weather for today" || req == "tell me what todays weather will be") {
            console.log('Client asks for weather information');
            var location = clientConfig.location; //Gets the location set int the clientConfig file.
            console.log('Config is set to location: ' + location); //Logs the location that config is set to.
            weather.find({search: location, degreeType: 'C'}, function(err, result){ //Finding the weather and dealing with the api.
                if(err) throw err;
              var tmp = result[0].current.temperature; //We recieve the tmp that's currently in the destination.
              var tmpAnswer = 'The weather in ' + clientConfig.location + ' is currently ' + tmp + ' degrees celsius.'; //Logs the final answer from server.
                    socket.emit('answer', {
                        answer: tmpAnswer
                    });
            });

        }
        else if(req == "what's the date" || req == "what date is it" || req == "what's the current date" || req == "date" || req == "whats the date now"){
            //Check time from clientConfig.json
            var today = new Date();
            var dd = today.getDate();
            var yyyy = today.getFullYear();
            var mm = today.getMonth()+1; //January is 0!
            today = 'The current date is: ' + mm + '-' + dd + '-' + yyyy;
            socket.emit('answer', {
                answer: today
            });
        }
        else if(req == "what's the time" || req == "what time is it" || req == "what's the current time" || req == "time" || req == "whats the time now" || req =="what's the clock"){
            
        }
        else if(n == true){
            var toWiki = req.replace(/what's|an| a |whats|the|/gi, "");
            
            console.log(toWiki);
            if(toWiki != ""){
            wiki.from_api(toWiki, 'en', function(markup) {
            var data = wiki.parse(markup);
                if(data.sections != undefined){
                    if(data.sections[0].sentences[0] != undefined){
                    var getdata = data.sections[0].sentences[0].text;
                    var response = getdata.replace("( )", "");
                    console.log(response);
                            socket.emit('answer', {
                                answer: response
                            });
                    }else {socket.emit('answer', {
                    answer: "I don't know what " + toWiki + " is."
                });}
                } else {socket.emit('answer', {
                    answer: "I don't know what " + toWiki + " is."
                });}
            });
            }
            //If the client sent a message containing information about the weaher.
        }

        //Checks if res was to send an email.
        else if(req == "send an email" || req == "email" || req =="can you send an email" || req == "please send an email"){
            console.log('Client wants to send an email'); 
            //I'm still thinking about this part of the system
            //Do we want some kind of contact list api or just to say the whole gmail adress?
            socket.emit('email');

        } else if(req == "add command" || req == "add" || req == "new command"){
            console.log('Client wants to add a new command!');
            socket.emit('newCMDReq');
        }

        else {
            //Checks all the commands in database.
            piDB.findOne({ input: req}, function(err, result){
                if(err) throw err;
                if (result != null) {
                    var answerCommand = result.output;
                    socket.emit('answer', {
                        answer: answerCommand
                    });
                } else {
                    console.log('Command not found in database');
                }
            });
        }


    });
    socket.on('emailInput', function(data){
        var email = data.email;
        console.log('Client wants to send an email to ' + email);
        socket.emit('message', {
          target: email
        });

    });
    socket.on('message', function(data){
      var tmpEmail = data.emailName;
      var message = data.message;

      var remSpaceEmail = removeWhitespace(tmpEmail); //Removes white spaces in the message 
      var targetEmail = remSpaceEmail + '@gmail.com'; //Adds the final bit to the email target.
      console.log('Sent an email to: ' + targetEmail + ' with the message: ' + message); //Logs that its now sending the message.
      sendEmail(targetEmail, message); //Passes all the variables to the send email function.

    });



    socket.on('newCMDRes', function(data){
        var newCommand = data.res; //Gets the new command and stores it in a variable.
        //Still under working progress
        socket.emit('newCMDAnswer', {
            newCommandQst : newCommand
        });
    });

    socket.on('finalCMDAnswer', function(data){


        //Get the main variables
        var dataqst = data.qst;
        var dataans = data.ans;

        var qst = dataqst.trim(); //Removes spaces
        var ans = dataans.trim(); //Remove spaces

        
        console.log(qst + ans);
        
        piDB.insert({input: qst, output: ans}, function(){
            console.log('Added (Input: '+ qst +' Output: '+ ans + ')');
        });
    });






    //This is the finale for sending an email.
    function sendEmail(targetEmail, message){
      var send = require('gmail-send')({
        user: clientConfig.gmailUser,

        pass: clientConfig.gmailPassword,

        to: targetEmail,

        subject: message,

        text: message
      });
      send();
      socket.emit('emailSuccess', {
        targetEmail: targetEmail
      });
    }
});
});



