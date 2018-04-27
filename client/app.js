const socket = io()

// Trivia component
const triviaComponent = {
	template: ` <div class="trivia-box">
                    <p>PLACEHOLDER QUESTIONOBJ</p>
	            </div>`,

	props: ['questionObj']
}

// Users Component
const usersComponent = {
    template: ` <div class="user-list">
                    <h6>Active Users ({{users.length}})</h6>
                    <ul v-for="user in users">
                        <li>
                            <img v-bind:src="user.avatar" class="circle" width="30px">
                            <span>{{user.name}}</span><span>({{user.score}})</span>
                        </li>
                        <hr>
                    </ul>
                </div>`,
    props: ['users']
}

// Me Component
const meComponent = {
    template: ` <div class="me" v-show="me.name">
                    <h5> Welcome </h5>
                        <img :src="me.avatar" class="circle" width="80px">
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
        failedAddQuestion: false
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

            socket.emit('create-user', this.userName, this.password)
        },
        submitQuestion: function () {
            if (!this.question || !this.possibleAnswer1 || !this.possibleAnswer2 || !this.possibleAnswer3 || !this.correctAnswer || !this.points) {
                return
            }

            socket.emit('create-question', this.question, this.possibleAnswer1, this.possibleAnswer2, this.possibleAnswer3, this.correctAnswer, this.points)
        },
        selectAnswer: function(answer) {
            if (!this.answer) {
                return
            }

            socket.emit('validate-answer', this.answer)
        }
    },
    components: {
        'users-component': usersComponent,
        'trivia-component': triviaComponent,
        'me-component': meComponent
    }
})

// Client Side Socket Event

// Refresh question
socket.on('refresh-question', questionObj => {
    console.log(questionObj)
    app.questionObj = questionObj
})

// Refresh userlist
socket.on('refresh-users', users => {
    app.users = users
})

// Successfully join (change screen)
socket.on('successful-join', user => {
    if (user.name === app.userName) {
        app.me = user
        app.loggedIn = true
        app.failed = ''
        app.password = ''
    }

    app.users.push(user)
})

// Failed to join because username exists
socket.on('failed-join', obj => {
    if (obj.name === app.userName)
        app.failedName = obj.name
})

// Successfully added a question
socket.on('successful-entry', questionObj => {
    app.failedAddQuestion = false
    app.question = ''
    app.possibleAnswer1 = ''
    app.possibleAnswer2 = ''
    app.possibleAnswer3 = ''
    app.correctAnswer = ''
    app.points = ''
})

// Failed to add a question
socket.on('failed-entry', questionObj => {
    app.failedAddQuestion = true
})