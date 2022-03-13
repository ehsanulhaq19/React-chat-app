require('dotenv').config();
var mysql = require('mysql')

var con = mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD
            });

module.exports.initDB = () => {    
    con.connect(function(err) {
        if (err) throw err;
        console.log("Sql connected...");
    
        con.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, function (err, result) {
            if (err) throw err;
            console.log("Database connected...");
        });
    
        let sql = `CREATE TABLE IF NOT EXISTS ${process.env.DB_NAME}.user (id INT NOT NULL AUTO_INCREMENT, user_name VARCHAR(255), PRIMARY KEY (id))`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("User table connected");
        });
        
        sql = `CREATE TABLE IF NOT EXISTS ${process.env.DB_NAME}.message (id INT NOT NULL AUTO_INCREMENT, user_id INT, room_id INT, message VARCHAR(255), PRIMARY KEY (id))`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Message table connected");
        });
    
        sql = `CREATE TABLE IF NOT EXISTS ${process.env.DB_NAME}.room_user (id INT NOT NULL AUTO_INCREMENT, room_id INT, user_id INT, PRIMARY KEY (id))`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Room_User table connected");
        });
        
        sql = `CREATE TABLE IF NOT EXISTS ${process.env.DB_NAME}.room (id INT NOT NULL AUTO_INCREMENT, room_id VARCHAR(255), PRIMARY KEY (id))`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Room table connected");
        });
    
    });
    
}

module.exports.initRooms = () => {
    let rooms = new Map()

    let sql = `SELECT * FROM ${process.env.DB_NAME}.message
                JOIN ${process.env.DB_NAME}.room ON ${process.env.DB_NAME}.message.room_id = ${process.env.DB_NAME}.room.id
                JOIN ${process.env.DB_NAME}.user ON ${process.env.DB_NAME}.message.user_id = ${process.env.DB_NAME}.user.id
                order by ${process.env.DB_NAME}.room.room_id`

    con.query(sql, function (err, result, fields) {
        if (err) throw err;
        result.map(res => {
            if (!rooms.has(res.room_id)) {
                rooms.set(
                    res.room_id,
                    new Map([
                    ['users', new Map()],
                    ['messages', []],
                    ]),
                );
            }
            
            let room = rooms.get(res.room_id)
            let userName = res.user_name
            let text = res.message
            const obj = {
                userName,
                text,
            };
            
            room.get('messages').push(obj);
        })

    })
    return rooms;
}

module.exports.createOrJoinRoom = (roomId, userName) => {
    let roomID;
    let userId;
    
    con.query(`SELECT * FROM ${process.env.DB_NAME}.room where room_id = '${roomId}'`, function (err, result, fields) {
        if (err) throw err;

        if(!result.length){
            let sql = `INSERT INTO ${process.env.DB_NAME}.room (room_id) VALUES ('${roomId}')`;
            con.query(sql, function (err, result) {
                if (err) throw err;

                roomID = result.insertId
            });
        }
        else{
            roomID = result[0].id
        }

    })
    .on('end', function() {
        let sql = `SELECT * from ${process.env.DB_NAME}.user where user_name = '${userName}'`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            
            if(!result.length) {
                let sql = `INSERT INTO ${process.env.DB_NAME}.user (user_name) VALUES ('${userName}')`;
                con.query(sql, function (err, result) {
                    if (err) throw err;

                    userId = result.insertId
                })
                .on('end', function() {
                    createRoomUser(roomID, userId)
                }); 
            }
            else{
                userId = result[0].id
            }
            
        })
        .on('end', function() {
            if(roomID && userId){
                createRoomUser(roomID, userId)
            }
        }); 
    });

    
}


const createRoomUser = (roomID, userId) => {
    let sql = `SELECT * from ${process.env.DB_NAME}.room_user where user_id = ${userId} and room_id = ${roomID}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        
        if(!result.length) {
            let sql = `INSERT INTO ${process.env.DB_NAME}.room_user (user_id, room_id) VALUES (${userId}, ${roomID})`;
            con.query(sql, function (err, result) {
                if (err) throw err;
            })
        }
        
    })
}

module.exports.createMessage = (roomID, userName, message) => {
    let roomId;
    let userId;

    let sql = `SELECT * FROM ${process.env.DB_NAME}.room where room_id = '${roomID}'`;
    con.query(sql, function (err, result) {
        if (err) throw err;

        roomId = result[0].id;

        let sql = `SELECT * FROM ${process.env.DB_NAME}.user where user_name = '${userName}'`;
        con.query(sql, function (err, result) {
            if (err) throw err;

            userId = result[0].id;
            sql = `INSERT INTO ${process.env.DB_NAME}.message (room_id, user_id, message) VALUES (${roomId}, ${userId}, '${message}')`;
            con.query(sql, function (err, result) {
                if (err) throw err;
            })
        })
    })
}