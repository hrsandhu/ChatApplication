$(function () {
    activeusers=[];
    var socket = io();
    $('form').submit(function(e){
        socket.emit('send cookie',document.cookie);
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    socket.on('chat message', function(msg){
        socket.emit('send cookie',document.cookie);
        $('#messages').append($('<li>').html(msg));
        scrolltobottomchat();

    });
    socket.on('self message', function(msg){
        $('#messages').append($('<li>').html(msg).css('font-weight', '700'));
        scrolltobottomchat();

    });

    //online Users
    socket.on('au',function (msg) {
        activeusers = msg;
        $("#usersonline").empty();
        $.each(activeusers, function(index, value){
            $("#usersonline").append($('<li>').text( value ));
        });
    });

    socket.on('chathis',function (msg) {
        chathistory = msg;
        $("#messages").empty();
        $.each(chathistory, function(index, value){
            $("#messages").append($('<li>').html(value));
            scrolltobottomchat();
        });

    });

    //You Are
    socket.on('username', function(msg){
        $('#usrname').empty();
        $('#usrname').append(msg);
    });
    socket.on('cookiesetter', function(msg){
        document.cookie = 'RubleChat='+ msg;
    });
});

function scrolltobottomchat(){
    $('#messages').scrollTop($('#messages').position().top - $('#messages li:first').position().top);
}

