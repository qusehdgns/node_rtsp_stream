var express = require('express');
var Stream = require('node-rtsp-stream');
var oracledb = require('oracledb');
const VideoStream = require('node-rtsp-stream/videoStream');
module.exports = require('node-rtsp-stream/videoStream');

var app = express();
var dbdata;
var streaming = new Array();
var temp = new Array();
var conn;

app.listen(8088, function () {
    console.log("start express server on port 8088");
});

//오라클 접속
oracledb.getConnection({
    user: "cap",
    password: "1234",
    connectString: "localhost/XE"
}, function (err, con) {
    if (err) {
        console.log("접속이 실패했습니다.", err);
    }
    conn = con;

});

app.get('/', function (req, res) {
    console.log(req.query.want);
    if(req.query.want == 1){
        var k = 1;
        streaming.push(req.query.id);
        var position = streaming.length-1;
        streaming[position] = new Array();
        streaming[position].push(req.query.id);
        conn.execute(
            "SELECT * FROM ACCESS_IP "
            + "WHERE USERID LIKE '" + req.query.id + "'",
            function (err, result) {
                if (err) {
                    console.log("실패했습니다.", err);
                }
                dbdata = result.rows;
                for (var i = 0; i < dbdata.length; i++) {
                    var check = true;
                    for (var j = 0; j < i; j++) {
                        if (dbdata[j][6] == dbdata[i][6]) {
                            check = false;
                            break;
                        }
                    }
                    if (check) {
                        streaming[position].push("");
                        streaming[position][k] = new VideoStream({
                            name: 'stream',
                            streamUrl: 'rtsp://' + dbdata[i][4] + ':' + dbdata[i][5] + '@' + dbdata[i][1] + ':' + dbdata[i][2] + '/udp/av0_0',
                            wsPort: dbdata[i][6],
                            ffmpegOptions: { // options ffmpeg flags
                                '-stats': '', // an option with no neccessary value uses a blank string
                                '-r': 30 // options with required values specify the value after the key
                              }
                        });
                        k++;
                    }
                }
            }
        );
    } else {
        var position = -1;
        for(var i = 0; i < streaming.length; i++){
            console.log(streaming[i][0]);
            if(req.query.id == streaming[i][0]){
                position = i;
                break;
            }
        }
        if(position != -1){
            for(var i = 1; i < streaming[position].length; i++){
                streaming[position][i].stop();
                console.log("end");
            }
            streaming.splice(position, 1);
        }
    }
});


