import express from 'express'

const config = {
    models: {
        users: {
            id: 'number',
            name: 'string',
            email: 'string|email'
        },
        todos: {
            id: 'number',
            title: 'string|required',
            description: 'string',
            status: 'enum(active,inactive,done)'
        }
    }
}

const allData = {
    users: [
        {
            id: 1,
            name: 'Hadi',
            email: 'thehadiahmadi@gmail.com'
        },
        {
            id: 2,
            name: 'Hadi2',
            email: 'thehadiahmadi2@gmail.com'
        }
    ],
    todos: [
        {
            id: 1,
            title: 'Title 1',
            description: 'lorem ipsum lorem ipsum lorem ipsum lorem ipsumlorem ipsum',
            status: 'inactive'
        },
        {
            id: 2,
            title: 'Title 2',
            description: 'lorem ipsum lorem ipsum lorem ipsum lorem ipsumlorem ipsum',
        },
        {
            id: 3,
            title: 'Title 1',
            status: 'done'
        },
    ]
}




const app = express();
app.use(express.json())




// async function handler({body, query, name }) {
    console.log('function', 'function') 


    
    // const handler = services[name](name);

    // const model = handler.model
    // const controller = handler.controller

    // const output = await controller.create({body, query})

    // return output
// }
// 


// app.use('/:name', async (req, res) => {

//     const name = req.params.name
//     const body = req.body
//     const query = req.query
//     const output = await handler({body, query, name})

//     res.send(output)
// })

app.use('/', (req, res) => {
    res.send("Hi")
})



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('listening on port ' + port)
})