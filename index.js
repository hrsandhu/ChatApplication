var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var usrnum = 0;
var chathistory = [];
var allclients = [];
var activeclients = [];

//All linkages to serve proper paths
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});
app.get('/clientside.js', function(req, res){
    res.sendFile(__dirname + '/clientside.js');
});
app.get('/style.css', function(req, res){
    res.sendFile(__dirname + '/style.css');
});

//Incoming Connection
io.on('connection', function(socket){
    //Check Cookie and get username or create username and add to all clients list
    var cookie = socket.handshake.headers['cookie'];
    if (!checkcookieexists(cookie,'RubleChat')){
        socket.nickname = 'User' + usrnum;
        usrnum = usrnum + 1;
        allclients.push(socket.nickname);
    }
    else socket.nickname = parsecookievalue(cookie,'RubleChat');

    //Set nick color
    socket.color = '000000';

    //Check if Person joing already has a tab open and is an active client
    if(checkuniquenick(socket.nickname,activeclients)){
        activeclients.push(socket.nickname);
        socket.broadcast.emit('chat message', '<i>'+socket.nickname+' Has Joined the Chat'+ '</i>');
    }

    //Emit activeclients list, personal username, tell client to set cookie, send existing chat history
    io.emit('au', activeclients);
    socket.emit('username','You are: ' + socket.nickname);
    socket.emit('cookiesetter',socket.nickname);
    socket.emit('chathis',chathistory);

    //Disconnect Set by Client
    socket.on('disconnect', function(){
        activeclients.splice(activeclients.indexOf(socket.nickname), 1);
        io.emit('au', activeclients);
        socket.broadcast.emit('chat message', '<i>'+socket.nickname+' Has Left the Chat'+ '</i>');
    });

    //Incoming Chat Message
    socket.on('chat message', function(msg){
        socket.emit('username','You are: ' + socket.nickname);
        if(checkuniquenick(socket.nickname,activeclients)){
            activeclients.push(socket.nickname);
            io.emit('au', activeclients);
        }
        var timestamp = getTimestamp();
        var parsedmsg= msg.split(' ');

        //Checking for nick or color change
        if (parsedmsg.length===2){
            //color change
            if (parsedmsg[0] === '/nickcolor' && parsedmsg[1].length === 6){
                socket.color=parsedmsg[1];
            }
            //nick change
            if (parsedmsg[0] === '/nick'){
                if (parsedmsg[1].length > 0 && parsedmsg[1].length < 9 && checkuniquenick(parsedmsg[1],allclients) && regexboolcheck(parsedmsg[1])) {
                    activeclients.splice(activeclients.indexOf(socket.nickname), 1);
                    allclients.splice(allclients.indexOf(socket.nickname), 1);
                    socket.broadcast.emit('chat message', '<i>'+socket.nickname+' Has Changed their Username to: '+parsedmsg[1]+ '</i>');
                    socket.nickname = parsedmsg[1];
                    socket.emit('cookiesetter',socket.nickname);
                    allclients.push(socket.nickname);
                    activeclients.push(socket.nickname);
                    io.emit('au', activeclients);
                    socket.emit('username', 'You are: ' + socket.nickname);
                }
                else socket.emit('self message', 'USERNAME NOT ACCEPTED - Req: historically unique, < 8 characters, alphanumeric');
            }
        }
        msg= '['+timestamp +']'+ ' '+'<font color='+'"'+socket.color+'">'+ socket.nickname+'</font>'+ ": " +msg;
        chathistory_add(msg);
        socket.emit('self message',msg);
        socket.broadcast.emit('chat message', msg);
    });
    //Cookie Update From Client
    socket.on('send cookie', function(msg){
        if(msg.split('=') !== undefined){
            msg = msg.split('=');
            if(msg[msg.findIndex(element => element.includes('RubleChat'))]!==undefined){
                msg = msg[msg.findIndex(element => element.includes('RubleChat'))+1];
                socket.nickname = msg;
            }
        }
        io.emit('au', activeclients);
        socket.emit('username','You are: ' + socket.nickname);
    });

});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

function chathistory_add(m) {
    if (chathistory.length >= 200) chathistory.shift();
    chathistory.push(m)
}

function checkuniquenick(nickname,clientarray){
    if(clientarray.includes(nickname)) return false;
    else return true;
}

function regexboolcheck(m){
   return /^[a-z0-9]+$/i.test(m)
}

function checkcookieexists(cookie, keyword){
    if (cookie === undefined)return false;
    if (cookie.split('; ')===undefined)return false;
    cookie= cookie.split('; ');
    if (cookie[cookie.findIndex(element => element.includes(keyword))]===undefined) return false;
    else return true;

}

function parsecookievalue(cookie, keyword){
    cookie= cookie.split('; ');
    cookie= cookie[cookie.findIndex(element => element.includes(keyword))].split('=')[1];
    return cookie
}

function getTimestamp(){
    var timestamp = new Date();
    var minutes = timestamp.getMinutes().toString();
    var hours = timestamp.getHours().toString();
    if (minutes.length < 2) minutes = '0'+minutes;
    if (hours.length < 2) hours = '0'+hours;
    timestamp = hours + ":" + minutes;
    return timestamp;
}