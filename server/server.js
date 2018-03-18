//Server script for the voice recognition and searching in database for solutions.
const client = require('socket.io').listen(8000).sockets;
const command = require('./commands.json');
const fs = require('fs');

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



        }else {
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
});
