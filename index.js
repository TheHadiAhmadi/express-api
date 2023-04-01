const generateTs = require("./generate_ts");
const MiniApi = require("./lib");
const { ObjectMap } = require("./utils");

const config = {
    services: {
        users: {
            fields: {
                name: { type: 'string', label: 'Name', required: true, pattern: '[a-zA-Z_]', filterable: true, sortable: true },
                email: { type: 'string', label: 'Email', required: true, filterable: true, sortable: true }, // email,
                age: { type: 'number', label: 'Age', min: 18, filterable: true, sortable: true },
                todos: { type: 'array', label: 'Todos', items: 'todos', filterable: true, sortable: true }
            },
            // id: true,
            // createdAt: true,
            // updatedAt: true
        },
        todos: {
            fields: {
                title: { type: 'string', filterable: true, sortable: true },
                status: { type: 'enum', items: ["done", 'progress', 'cancelled', 'new'], filterable: true, sortable: true },
            }
        }
    },
    port: 3000,
    db: 'https://minibase-db-2.vercel.app'
}


const app = MiniApi(config)

const UserService = {
    async test(ctx) {
        // 
    },
    async user2(ctx) {
        // 
    }
}

const TodoService = {
    async todoss(ctx) {
        // 
    },
    async todo2(ctx) {
        // 
    }
}


const SystemService = {
    ts: async (ctx) => {
        const fields = ObjectMap(ctx.models, model => model.fields())

        return generateTs(fields)
    },
    fields: async (ctx) => {
        return ObjectMap(ctx.models, model => model.fields())
    }
}

app.useService('system', SystemService)


app.useService('users', UserService);
app.useService('todos', TodoService);

app.express().then(app => {

    app.listen(3000, () => {
        console.log('App Started on port: ' + 3000)
    })
})
module.exports = app
