const { validate, initValidators } = require('./validator.js')

const express = require('express')

const cors = require('cors')

class MiniApi {
    config = null
    models = null
    app = null
    validators = null
    data = {}

    constructor(config) {
        this.config = config
        this.models = config.models ?? {}
        this.seeds = config.seeds
        this.app = express()
        this.app.use(cors())
        this.app.use(express.json())
    
    }

    getItem(model, id) {
        // return item with preloads

        const item = this.data[model].find(i => i.id === id);
        
        const preloads = Object.keys(this.validators[model]).map(key => {
            const validators = this.validators[model][key]

            for(let validator of validators) {
                if(validator.name === 'relation') {
                    console.log('____', validator)

                    const preload = this.data[validator.model].filter(i => {
                        console.log('inside filter', i.id, i, item)

                        console.log('test: ', id.id == item[key])

                        // this.data[key]
                        validator.getField(key)
                        // return 
                    })
                    
                    
                    // console.log({preload})
                    if(!preload) {
                        if(validator.multiple) {
                            item[key] = []
                        } else {
                            item[key] = null
                        }
                    } else {
                        item[key] = preload
                    }
                }
            }
            
        })


        
        return item
        
    }

    Service = {
        create: ({body, query, params, name}) => {
            console.log(body)
            console.log(this.validators)
            const {data, errors} = validate(body, name)
            if(errors) return errors
    
            console.log({data})
            data.id = Math.floor(Math.random()*1000)
            this.data[name].push(data)
            return data
            // 
        },
        update: ({body, query, params, name}) => {
            const {data, errors} = validate(body, name)
            console.log(errors)
            if(errors) return errors
    
            console.log({data})
            this.data[name] = this.data[name].map(item => {
                console.log(item, data, params.id)
                if(item.id == params.id) {
                    return {...item, ...data}
                }
                return item
            })
        },
        getAll: ({body, query, params, name}) => {
            // apply preloads
            const data = this.data[name]
            // return data;
            return data.map(item => {
                return this.getItem(name, item.id)
            })

            // return data.map(item => {

            //     // return {...item, }
            // })
        },
        get: ({body, query, params, name}) => {
            return this.data[name].find(item => item.id == params.id)        
        },
        remove: ({body, query, params, name}) => {
            this.data[name] = this.data[name].filter(item => item.id != params.id)
        }
    }

    getServiceRouter(name) {
        const router = express.Router()
    
        function getOptions(req) {
            return {
                body: req.body,
                params: req.params,
                query: req.query,
                name
            }
        }
    
        router.get('/', async (req, res) => {
            const output = await this.Service.getAll(getOptions(req))
            res.send(output)
        })
    
        router.post('/', async (req, res) => {
            const output = await this.Service.create(getOptions(req))
            res.send(output)
        })
        router.get('/:id', async (req, res) => {
            const output = await this.Service.get(getOptions(req))
            res.send(output)
        })
        router.put('/:id', async (req, res) => {
            const output = await this.Service.update(getOptions(req))
            res.send(output)
        })
        router.delete('/:id', async (req, res) => {
            const output = await this.Service.remove(getOptions(req))
            res.send(output)
        })
        
        return router
    }
    
    initData() {
        this.data = {}
        Object.keys(this.models).map(model => {
            this.data[model] = []
        })
    }

    
    seedSingle(name) {
        const data = {}

        Object.keys(this.models[name]).map(key => {
            console.log(key)
            const schema = this.models[name][key];

            if(schema.startsWith('string')) {
                data[key] = 'some String'
            } else if(schema.startsWith('enum')) {
                data[key] = schema.substring(5, schema.indexOf(','));
            } else if(schema.startsWith('number')) {
                data[key] = Math.floor(Math.random() * 1000)
            } else if(schema.startsWith('relation')) {
                data[key] = 1
            }
        })

        if(!this.data[name]) this.data[name] = []
        this.data[name].push(data)
    } 

    seed(name, count) {
        Array.from({length: count}).map(() => this.seedSingle(name))
    }

    init() {
        this.validators = initValidators(this.models)
        // this.initRoutes(this.)

        console.log(this.validators)

        Object.keys(this.seeds).map(key => {
            this.seed(key, this.seeds[key])
        })

        console.log('init routes')
        Object.keys(this.models).map(model => {
            console.log('this.models: ', this.models)
            this.app.use(`/${model}`, this.getServiceRouter(model))
        })
    }
    
    handler() {
        this.init();
        return async (req, res) => {
          res.json({hello: 'world'})  
        } 
    }

    use(prefix, handler) {
        this.app.use(prefix, handler)
    }

    express(port = 3000) {
        
        console.log('init')
        this.init()
        
        // app.use('/', (req, res) => {res.send('Hello World!')})
        
        this.app.listen(port, () => console.log(`listening on port ${port}`))
        return this.app
    }
}

module.exports = MiniApi