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


const services = {}
const validators = {}

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

function enumRule(value, schema) {
    console.log('function', 'enumRule') 
    const itemsStr = schema.substring(5, schema.indexOf(')'))
    const items = itemsStr.split(',')
        
    return typeof value === 'string' && items.includes(value) ? value : undefined
} 

function requiredRule(value, schema) {
    console.log('function', 'requiredRule') 
    if(typeof value !== 'undefined') {
        return value;
    } else {
        throw Error('This field is required')
    }
}

function emailRule(value) {
    if(typeof value === 'undefined') return;
    if(typeof value === 'string' && value.indexOf('@') > -1) {
        return value
    } else {
        throw Error('This should be email')
    }
}

function stringRule(value) {
    if(typeof value === 'undefined') return;
    if(typeof value === 'string') {
        console.log('return ', value)
        return value
    } else {
        throw Error('This should be string')
    }
}

function numberRule(value) {
    if(typeof value === 'undefined') return;
    if(typeof value === 'number') {
        return value
    } else if(typeof value === 'string' && !isNaN(value)) {
        return Number(value)
    } else {
        throw Error('This should be number') 
    }
}

const allRules = {
    required: requiredRule,
    string: stringRule,
    number: numberRule,
    email: emailRule,
    enum: enumRule
}


function getValidators(rules) {
    console.log('function', 'getValidators') 
    return rules.map(rule => {
        console.log(rule)
        if(rule.startsWith('enum')) {
            return (value) => allRules['enum'](value, rule)
        } else {
            return (value) => allRules[rule](value)
        }
    })
}


function parseRules(rulesStr) {
    console.log('function', 'parseRules') 
    const rules = rulesStr.split('|')

    return getValidators(rules)    
}


function validate(object, model) {
    console.log('function', 'validate') 
    
    let data = null
    let errors = null

    

    for(let field of Object.keys(config.models[model])) {
        console.log({field}, object[field])
        const res = validators[model][field].reduce((_prev, validate) => {
            try {
                console.log('validating', field, object[field], 'returning: ', validate(object[field]))
                return validate(object[field])
            } catch(err) {
                if(!errors) errors = {}
                errors[field] = err.message
            }
        }, undefined)

        console.log(res)
        if(typeof res !== 'undefined') {
            if(!data) data = {}
            console.log('here', field, data, res)
            data[field] = res
            console.log('here', field, data, res)
        }
    }

    if(errors === null && data === null) {
        data = {}
    }

    return { data, errors }
}

function generateValidators(model) {
    console.log('function', 'generateValidators') 
    validators[model] = {}
    for(let field of Object.keys(config.models[model])) {        
        validators[model][field] = parseRules(config.models[model][field])
    }
    console.log(validators)
}


const app = express();
app.use(express.json())

const Service = {
    create: ({body, query, params, name}) => {
        console.log(body)
        const {data, errors} = validate(body, name)
        if(errors) return errors

        console.log({data})
        data.id = Math.floor(Math.random()*1000)
        allData[name].push(data)
        return data
        // 
    },
    update: ({body, query, params, name}) => {
        const {data, errors} = validate(body, name)
        console.log(errors)
        if(errors) return errors

        console.log({data})
        allData[name] = allData[name].map(item => {
            console.log(item, data, params.id)
            if(item.id == params.id) {
                return {...item, ...data}
            }
            return item
        })
    },
    getAll: ({body, query, params, name}) => {
        return allData[name]
    },
    get: ({body, query, params, name}) => {
        return allData[name].find(item => item.id == params.id)        
    },
    remove: ({body, query, params, name}) => {
        allData[name] = allData[name].filter(item => item.id != params.id)
    }
}

function getServiceRouter(name) {
    console.log('function', 'getServiceRouter') 
    const router = express.Router()

    generateValidators(name)

    router.get('/', async (req, res) => {
        console.log('get model', name)
        const output = await Service.getAll({body: req.body, params: req.params, query: req.query, name})
        res.send(output)
    })

    router.post('/', async (req, res) => {
        console.log('post model', name)
        const output = await Service.create({body: req.body, params: req.params, query: req.query, name})
        res.send(output)
    })
    router.get('/:id', async (req, res) => {
        console.log('get single item', name, req.params.id)
        const output = await Service.get({body: req.body, params: req.params, query: req.query, name})
        res.send(output)
    })
    router.put('/:id', async (req, res) => {
        console.log('update item', name, req.params.id)
        const output = await Service.update({body: req.body, params: req.params, query: req.query, name})
        res.send(output)
    })
    router.delete('/:id', async (req, res) => {
        console.log('delete item', name, req.params.id)
        const output = await Service.remove({body: req.body, params: req.params, query: req.query, name})
        res.send(output)
    })
    
    return(router)
}

// async function handler({body, query, name }) {
    console.log('function', 'function') 


    
    // const handler = services[name](name);

    // const model = handler.model
    // const controller = handler.controller

    // const output = await controller.create({body, query})

    // return output
// }
// 

Object.keys(config.models).map(model => {
    app.use(`/${model}`, getServiceRouter(model))
})


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