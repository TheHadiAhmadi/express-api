const MiniApi = require("./lib.js");

const api = new MiniApi({
    models: {
        users: {
            id: 'number',
            name: 'string|required',
            email: 'string|required|email',
            status: 'enum(1, 3, 54, 43 , 3)'
        },
        todos: {
            id: 'number',
            title: 'string|default(Hello)|required',
            creator: 'relation(users,creator_id)|default(1)|required',
            tags: 'relation(tags[])|required',
            tag: 'relation(tags)|default(1)'
        },
        tags: {
            id: 'number',
            name: 'string'
        }
    },
    seeds: {
        users: 1000,
        todos: 10,
        tags: 10
    }
})

module.exports = api.express(3000)