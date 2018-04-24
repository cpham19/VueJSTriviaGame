const socket = io()

// Trivia Component
const triviaComponent = {
    template: ` <div class="trivia-box">

                </div>`,
    props: ['content']
}

// Users Component
const usersComponent = {
    template: ` <div class="user-list">
                    <h6>Active Users ({{users.length}})</h6>
                    <ul v-for="user in users">
                        <li>
                            <img v-bind:src="user.avatar" class="circle" width="30px">
                            <span>{{user.name}}</span><span>{{user.score}}</span>
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
        game: []
    },
    methods: {
        joinUser: function () {
            // Reject if user doesn't put name or password
            if (!this.userName || !this.password)
                return

            socket.emit('join-user', this.userName, this.password)
        },
        signupUser: function () {
            // Reject if user doesn't put name or password
            if (!this.userName || !this.password)
                return

            socket.emit('create-user', this.userName, this.password)
        }
    },
    components: {
        'users-component': usersComponent,
        'trivia-component': triviaComponent,
        'me-component': meComponent
    }
})


// Client Side Socket Event

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
socket.on('failed-join', userName => {
    if (userName === app.userName)
        app.failedName = userName
})