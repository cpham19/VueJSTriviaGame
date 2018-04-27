module.exports = (server, db) => {
    const
        io = require('socket.io')(server),
        moment = require('moment')

    io.on('connection', socket => {
        // when a connection is made - load in the content already present on the server
        db.activeUsers().then(users => socket.emit('refresh-users', users))

        // Generate a random question and send to the app.js
        db.questions().then(questions=> {
            const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
            socket.emit('refresh-question', randomQuestion)
        })

        // demo code only for sockets + db
        // in production login/user creation should happen with a POST to https endpoint
        // upon success - revert to websockets
        socket.on('create-user', (userName, password) => {
            // create user
            db.createUser(userName, password, socket.id)
                // success
                .then(created => io.emit('successful-join', created))
                // error
                .catch(err => io.emit('failed-join', { name: userName }))
        })

        socket.on('join-user', (userName, password) => {
            // login
            db.loginUser(userName, password, socket.id)
                // success
                .then(created => io.emit('successful-join', created))
                // error
                .catch(err => io.emit('failed-join', {name: userName }))
        })

        socket.on('create-question', (question, possibleAnswer1, possibleAnswer2, possibleAnswer3, correctAnswer, points) => {
            // create question
            db.createQuestion(question, possibleAnswer1, possibleAnswer2, possibleAnswer3, correctAnswer, points)
                // success
                .then(created => io.emit('successful-entry', created))
                // error
                .catch(err => io.emit('failed-entry', {question: question}))
        })

        socket.on('disconnect', () => {
            // logout the user
            db.logoutUser(socket.id)
                // update the actives
                .then(() => db.activeUsers())
                .then(users => io.emit('refresh-users', users))
        })
    })
}