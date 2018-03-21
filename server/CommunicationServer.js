//Server script for the voice recognition and searching in database for solutions.
const client = require('socket.io').listen(8000).sockets;
const command = require('./commands.json');
const fs = require('fs');
const removeWhitespace = require('remove-whitespace');
//FOR SPECIAL COMMANDS FOR THE BOT
const clientConfig  = require('../clientConfig.json');

const weather = require('weather-js');
console.log('Weather node started up.');



console.log('Server for piAssistance voice recognition bot is running...'); //Start of bot.
console.log('Packages were successfully started & running.'); //Start of bot.

client.on('connection', function(socket){ //If we get a connection.
    console.log('A connection was made to the server.')
    socket.on('input', function(data){ //If we get an input from client

        //Setting up variables to handle the input given by the client.
        var edit = data.final.toLowerCase();
        var trim = edit.trim();
        var req = trim;


        console.log('Client sent message: ' + req);

        //Checks if we should add something into the database.
        if(req == "add"){
            console.log('Adding into json file...');
            socket.emit('answer', {
                question: "quesiton",
                answer: "Say the question first, then you will hear a sound effect. After that say the answer!"
            });


            //Adds something if needed. (STILL UNDER WORKING PROGRESS, WE DON'T RECOMMEND USING IT RN)
            fs.readFile('commands.json', 'utf8', function readFileCallback(err, data){
                if (err) throw err;
                object = JSON.parse(data);
                object.commands.push({input: "something", output: "anything"});
                var json = JSON.stringify(object);
                fs.writeFile('commands.json', json, 'utf8');
            });



        } else if (req == 'weather' || req == "what's the weather" || req == "what's the weather for today" || req == "tell me what todays weather will be") {
            console.log('Client asks for weather information');
            var location = clientConfig.location;
            console.log('Config is set to location: ' + location);
            weather.find({search: location, degreeType: 'C'}, function(err, result){
                if(err) throw err;
              var tmp = result[0].current.temperature; //We recieve the tmp that's currently in the destination.
              var tmpAnswer = 'The weather in ' + clientConfig.location + ' is currently' + tmp + 'degrees celsius.';
                    socket.emit('answer', {
                        answer: tmpAnswer
                    });
            });

        }


        else if(req == "send an email" || req == "email" || req =="can you send an email" || req == "please send an email"){
            console.log('Client wants to send an email');
            //I'm still thinking about this part of the system
            //Do we want some kind of contact list api or just to say the whole gmail adress?
            socket.emit('email');

        }

        else {
            //Checks all the commands
            for (var i = 0; i < command.commands.length; i++){
                if(command.commands[i].input == req){
                    var answerCommand = command.commands[i].output;
                    console.log('Command found in database.');
                    console.log('Sending response to client:' + command.commands[i].output);
                    socket.emit('answer', {
                        answer: answerCommand
                    });
                    //If we cant find it in database.
                }else if(command.commands[i] == command.commands.length){
                        console.log('Command not found in database.');

                }
            }
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

      var remSpaceEmail = removeWhitespace(tmpEmail);
      var targetEmail = remSpaceEmail + '@gmail.com';
      console.log('Sent an email to: ' + targetEmail + ' with the message: ' + message);
      sendEmail(targetEmail, message);

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
