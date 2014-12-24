var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var socket = require('socket.io');
var redis = require('redis');
var redisClient = redis.createClient();
var io =socket.listen(server);
var users = [];





function removeA(arr){
    var what, a= arguments, L= a.length, ax;
    while(L> 1 && arr.length){
        what= a[--L];
        while((ax= arr.indexOf(what))!= -1){
            arr.splice(ax, 1);
        }
    }
    return arr;
}
var storeMessage = function(name, data) {
    var message = JSON.stringify({name:name, data:data});
    redisClient.lpush("messages",message, function(err, reply){
        redisClient.ltrim("mesages",0,10);
    });
}

app.get('/', function(req, response){
   response.sendfile(__dirname+"/index.html");
});
app.get('/webroot/*', function(req, response){
    response.sendfile(__dirname+req.path);
});
app.get('/bower_components/*', function(req, response){
    response.sendfile(__dirname+req.path);
});

server.listen(3000, function() {
   console.log('Listening on 3000');
});

io.sockets.on('connection', function(client){
    console.log('Client connected.');
    client.on('join', function(name) {
        client.set('nickname', name);
        users.push(name);
        client.emit('users', users);
        client.broadcast.emit('users', users);
        redisClient.lrange("messages", 0, -1 , function (err, messages){
            messages = messages.reverse();
            messages.forEach(function(message) {
                message = JSON.parse(message);
                client.emit("messages", {name:message.name, message:message.data});
            });
        });

    });
    client.on('messages', function(data){

        client.get('nickname', function(err, name){
            storeMessage(name, data);
            client.broadcast.emit("messages", {name:name, message:data});
        });
    });
    client.on('typing', function(data) {
        console.log(data + ' is typing...');

        client.broadcast.emit('typing', data);

    });
    client.on('disconnect', function(data){
        client.get('nickname', function(err, name){
            users = removeA(users, name);
            client.broadcast.emit("users", users);
            console.log(name);


        });
        console.log('disconnecting client');
        // users = removeA(users, name);
        //client.broadcast.emit("users", users);


    });
});


