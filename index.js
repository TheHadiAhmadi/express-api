import express from 'express'


// Model is a function which return {name, create, update, remove, query}
// Controller is a function which return object of handler functions
// {create: HandleCreate, update: HandleUpdate, index: HandleIndex,....}


function BaseModel(name) {
    return {
        name,
        create(data) {
            // insert into database
            console.log('create model: ', name, data)
        }
    }
}

function createModel(name, schema) {

}

function BaseController(model) {
    return {
        create: ({body, query}) => {
            console.log('create ' + model.name)
            return {
                body, query
            }

        }
    }
}
function BaseService(name) {
    const model = BaseModel(name)
    const controller = BaseController(model)
    return {
        model,
        controller
    }
}

const PostModel = {
    id: 'number',
}

const UserModel = {
    id: 'number',
    name: 'string',
    age: 'number',
}


function UserController(model) {
    return {
        ...BaseController(model),
        create: () => console.log("CREATE USER")
    }
}

function UserService() {
    const model = BaseModel('user')
    return {
        model,
        controller: UserController(model)
    }
}


const app = express();
app.use(express.json())

const services = {
    user: UserService,
    todo: BaseService
}


async function handler({body, query, name }) {
    const handler = services[name](name);

    const model = handler.model
    const controller = handler.controller

    const output = await controller.create({body, query})

    return output
}


app.use('/:name', async (req, res) => {

    const name = req.params.name
    const body = req.body
    const query = req.query
    const output = await handler({body, query, name})

    res.send(output)
})

app.use('/', (req, res) => {
    res.send("Hi")
})


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('listening on port ' + port)
})