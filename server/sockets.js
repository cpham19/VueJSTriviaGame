module.exports = (server, db) => {
    const
        io = require('socket.io')(server),
        moment = require('moment')

    // Timer to refresh the question after 30 seconds and display the result at 15 secs
    let second = 31
    let resultObj = {}
    let randomQuestion = {}
    const timer = setInterval(function(){
        second--
        io.emit('refresh-time', second)
        if (second === 30) {
            // Load a random question at startup of server
            db.questions().then(questions => {
                // Generate a random question
                randomQuestion = questions[Math.floor(Math.random() * questions.length)]

                // Initialize values for occurences of selected possible answers
                randomQuestion.possibleAnswers.forEach(answer => {
                    resultObj[answer] = 0
                })

                io.emit('refresh-question', randomQuestion)
            })
        }
        else if (second === 15) {
            // Update the userlist (to update the score)
            db.activeUsers().then(users => io.emit('refresh-users', users))
            io.emit('display-result', resultObj)
        }
        else if (second === 0) {
            second = 31
            resultObj = {}
        }
    }, 1000);

    io.on('connection', socket => {
        // when a connection is made - load in the content already present on the server
        db.activeUsers().then(users => socket.emit('refresh-users', users))

        // Load the questions already present on the server
        db.questions().then(questions => socket.emit('refresh-questions', questions))

        // Load the random question at startup of server
        socket.emit('refresh-question', randomQuestion)
        
        // demo code only for sockets + db
        // in production login/user creation should happen with a POST to https endpoint
        // upon success - revert to websockets
        socket.on('create-user', (userName, password, admin) => {
            // create user
            db.createUser(userName, password, admin, socket.id)
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

        socket.on('delete-question', (question) => {
            // delete question
            db.deleteQuestion(question)
                // success
                .then(deleted => io.emit('successful-delete', deleted))
                // error
                .catch(err => io.emit('failed-delete', question))
        })

        socket.on('validate-answer', (me, questionObj, answer) => {
            if (questionObj.correctAnswer === answer) {
                me.score += questionObj.points
            }
            else {
                me.score -= questionObj.points
            }

            resultObj[answer] = resultObj[answer] + 1

            // Update user
            db.updateScore(me.name, me.score)
                // success
                // Object with updated score is sent back to app.js
                .then(validated => io.emit('successful-validate', validated))
                // error
                .catch(err => io.emit('failed-validate', err))
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