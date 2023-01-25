const MiniApi = require("./lib.js");

const api = new MiniApi({models: {
    users: {
        id: 'number',
        name: 'string|required',
        email: 'string|required|email'
    },
    todos: {
        id: 'number',
        title: 'string'
    }
}})

module.exports = api.express(3000)