const socket = io()

const availableQuestionsComponent = {
    template:`<div class="column"> 
                <h6 align="center">Questions in Database ({{list.length}})</h6>
                <hr>
                <ul v-for="obj in list">
                    <li>
                        <p v-show="admin">{{obj.question}} <button v-on:click="$emit('delete', obj.question)" class="delete" type="submit">Delete</button></p>
                        <p v-show="!admin">{{obj.question}}</p>
                    </li>
                    <hr>
                </ul>
            </div>`,
    props: ['list', 'admin']
}

// Trivia component
const triviaComponent = {
    template: ` <div class="trivia-box" v-show="!add">
                    <h1 align="center">{{time}}</h1>
                    <h6 align="center">{{question.question}}</h6>
                    <hr>
                    <h6 align="center" v-show="time <= 15">The correct answer is: {{question.correctAnswer}}</h6>
                    <p align="center" v-show= "time > 15 && answered">Please wait until the 15 second mark</p>
                    <ul v-show="time <= 15" v-for="(occurence, answer) in results">
                        <li>
                            <h6>'{{answer}}' was picked {{occurence}} time(s).</h6>
                        </li>
                    </ul>
                    <ul v-show="time > 15 && !answered" v-for="answer in question.possibleAnswers">
                        <li>
                            <button v-on:click="$emit('pressed', answer)" class="btn-small waves-effect waves-light" type="submit">{{answer}}</button>
                        </li>
                    </ul>
                </div>`,

	props: ['question', 'time', 'add', 'results', 'answered']
}

// Users Component
const usersComponent = {
    template: ` <div class="user-list">
                    <h6 align="center">Active Users ({{users.length}})</h6>
                    <ul v-for="user in users">
                        <li>
                            <img v-bind:src="user.avatar" class="circle" width="30px">
                            <span>{{user.name}}</span><span>({{user.score}})</span>
                            <img v-show="user.admin" src="img/admin.png" class="circle" width="15px">
                        </li>
                        <hr>
                    </ul>
                </div>`,
    props: ['users']
}

// Me Component
const meComponent = {
    template: ` <div class="me" v-show="me.name">
                    <h5 v-show="me.admin"> Welcome Admin </h5>
                    <h5 v-show="!me.admin"> Welcome </h5>
                        <img v-bind:src="me.avatar" class="circle" width="80px">
                        <h6>{{me.name}}</h6>
                </div>`,
    props: ['me']
}

const app = new Vue({
    el: '#trivia-app',
    data: {
        loggedIn: false,
        userName: '',
        password: '',
        admin: false,
        failedName: '',
        me: {},
        users: [],
        question: '',
        possibleAnswer1: '',
        possibleAnswer2: '',
        possibleAnswer3: '',
        correctAnswer: '',
        points:'',
        questionObj: {},
        failedAddQuestion: false,
        listOfQuestions: [],
        add: true,
        currentTime: '',
        answered: false,
        results: {}
    },
    created: function() {
        // Unload resources after closing tab or browser
        document.addEventListener('beforeunload', this.handler) }, methods: { handler: function handler(event) {}
    },
    methods: {
        joinUser: function () {
            // Reject if user doesn't put name or password
            if (!this.userName || !this.password) {
                return
            }

            socket.emit('join-user', this.userName, this.password)
        },
        signupUser: function () {
            // Reject if user doesn't put name or password
            if (!this.userName || !this.password) {
                return
            }

            socket.emit('create-user', this.userName, this.password, this.admin)
        },
        submitQuestion: function () {
            if (!this.question || !this.possibleAnswer1 || !this.possibleAnswer2 || !this.possibleAnswer3 || !this.correctAnswer || !this.points) {
                return
            }

            socket.emit('create-question', this.question, this.possibleAnswer1, this.possibleAnswer2, this.possibleAnswer3, this.correctAnswer, this.points)
        },
        deleteQuestion: function(selectedQuestion) {
            socket.emit('delete-question', selectedQuestion)
        },
        submitAnswer: function(answer) {
            this.answered = true

            socket.emit('validate-answer', this.me, this.questionObj, answer)
        },
        toggle: function() {
            if (this.add) {
                return this.add = false
            }
            else {
                return this.add = true
            }
        }
    },
    components: {
        'users-component': usersComponent,
        'trivia-component': triviaComponent,
        'me-component': meComponent,
        'questions-component': availableQuestionsComponent
    }
})

// Client Side Socket Event

// Display result
socket.on('display-result', resultObj => {
    app.results = resultObj
    app.answered = false
}) 

// Refresh time
socket.on('refresh-time', time => {
    app.currentTime = time

})

// Refresh questions obtained from database
socket.on('refresh-questions', questions => {
    app.listOfQuestions = questions
})

// Refresh question
socket.on('refresh-question', questionObj => {
    app.questionObj = questionObj
})

// Refresh userlist
socket.on('refresh-users', users => {
    users.sort((a,b) => {
        return b.score - a.score
    })
    app.users = users
})

// Successfully join (change screen)
socket.on('successful-join', user => {
    if (app.userName === user.name) {
        app.me = user
        app.loggedIn = true
        app.failed = ''
        app.password = ''
        app.admin = user.admin
    }
        
    app.users.push(user)
})

// Failed to join because username exists
socket.on('failed-join', obj => {
    if (obj.name === app.userName)
        app.failedName = obj.name
})

// Successfully added a question
socket.on('successful-entry', obj => {
    app.failedAddQuestion = false
    app.question = ''
    app.possibleAnswer1 = ''
    app.possibleAnswer2 = ''
    app.possibleAnswer3 = ''
    app.correctAnswer = ''
    app.points = ''
    app.listOfQuestions.push(obj)
})

// Successfully validated answer
socket.on('successful-validate', obj => {
    if (obj.name === app.me.name) {
        app.me.score = obj.score
    }
})

// Failed to add a question
socket.on('failed-entry', obj => {
    app.failedAddQuestion = true
})

// Successfully delete a question
socket.on('successful-delete', obj => {
    app.listOfQuestions = app.listOfQuestions.filter(questionObj => !(obj.question === questionObj.question))
})
