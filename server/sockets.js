module.exports = (server, db) => {
    const
        io = require('socket.io')(server),
        moment = require('moment')

    io.on('connection', socket => {
        // when a connection is made - load in the content already present on the server
        db.activeUsers().then(users => socket.emit('refresh-users', users))

        // Load the questions already present on the server
        db.questions().then(questions => socket.emit('refresh-questions', questions))

        //const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
         //socket.emit('refresh-question', randomQuestion)

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

            // // Update the list of questions
            // db.questions().then(questions=> socket.emit('refresh-questions', questions))
        })

        socket.on('delete-question', (question) => {
            // delete question
            db.deleteQuestion(question)
                // success
                .then(deleted => io.emit('successful-delete', deleted))
                // error
                .catch(err => io.emit('failed-delete', question))

            // // Update the list of questions
            // db.questions().then(questions=> socket.emit('refresh-questions', questions))
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