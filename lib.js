const generateTs = require('./generate_ts');
const { ObjectMap } = require('./utils');
const { validate } = require('./validator');

const BaseService = {

    extend(methods) {
        return { ...this, ...methods }
    },
    async insert(ctx) {
        const data = validate(ctx.fields, ctx.body);
        return await ctx.model.insert(data)
    },
    async update(ctx) {
        const data = validate(ctx.fields, ctx.body);
        return await ctx.model.update(ctx.body.id, data);
    },
    async remove(ctx) {
        return await ctx.model.remove(ctx.body.id)
    },
    async query(ctx) {
        return await ctx.model.query(ctx.body)
    },
    async get(ctx) {
        return await ctx.model.get(ctx.body.id)
    },
    fields(ctx) {
        return ctx.fields
    }
}


async function getDbSchema(url) {
    return fetch(url + '/schema', {
        method: 'POST',
    }).then(res => res.json())
}

async function migrateDb(url, migration) {
    return fetch(url + '/migrate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(migration)
    }).then(res => res.json())
}

function createRequest(baseUrl) {
    return async (pathname, method, body) => {
        return fetch(baseUrl + pathname, {
            method: method ?? 'GET',
            headers: {
                'Content-type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        }).then(res => res.json())
    }
}

module.exports = function MiniApi(config) {
    let app;
    let dbSchema = {}
    let customServices = {}
    const db = createRequest(config.db)

    const getModel = (table) => ({
        fields: () => {
            return config.services[table].fields ?? {}
        },
        insert: (data) => {
            data.createdAt = new Date().toISOString()
            data.updatedAt = new Date().toISOString()

            return db(`/${table}`, 'POST', data)
        },
        update: (id, data) => {
            data.updatedAt = new Date().toISOString()

            return db(`/${table}/${id}`, 'PUT', data)
        },
        remove: (id) => {
            return db(`/${table}/${id}`, 'DELETE')
        },
        query: (body) => {
            const query = `?sort=${body.sort ?? ''}&page=${body.page ?? ''}&filters=${body.filters ?? ''}&perPage=${body.perPage ?? ''}`

            return db('/' + table + query)
        },
        get: (id) => {
            return db(`/${table}/${id}`)
        },
    })


    function initRoutes(name, service) {
        ObjectMap(service, (handler, key) => {
            if (key === 'extend') return;

            app.get(`/${name}/${key}`, async (req, res) => {

                function getOptions(req) {

                    const models = ObjectMap(config.services, (service, key) => {
                        return getModel(key)
                    })

                    return {
                        body: { ...req.body, ...req.query },
                        service: name,
                        models,
                        model: models[name],
                    }

                }

                let output = await handler(getOptions(req))
                res.send(output)
            })
        })
    }

    async function init() {
        dbSchema = await getDbSchema(config.db);
        console.log('dbSchema: ', dbSchema)


        ObjectMap(config.services, (service, key) => {
            initRoutes(key, service ?? BaseService)
            if (!dbSchema[key]) {
                const columns = ObjectMap(service.fields, (field, key) => {
                    return {
                        name: key,
                        type: field.type === 'enum' ? 'string' : field.type
                    }
                })
                console.log(columns)

                migrateDb(config.db, {
                    type: 'add-table',
                    name: key,
                    columns: [
                        ...Object.values(columns),
                        { name: 'createdAt', type: 'string' },
                        { name: 'updatedAt', type: 'string' }
                    ]
                })
            }
        })

        ObjectMap(customServices, (service, key) => {
            initRoutes(key, service)
        })

    }

    async function _express() {
        app = require('express')()

        await init();

        return app;
    }

    function useService(serviceName, service) {
        // 
        // initRoutes(serviceName, service);
        customServices[serviceName] = service
    }


    return {
        express: _express,
        init,
        useService
    }
}



// initRoutes('system', SystemService)

// const { validate, initValidators } = require('./validator.js')

// const express = require('express')

// const cors = require('cors')

// class MiniApi {
//     config = null
//     models = null
//     app = null
//     validators = null
//     data = {}

//     constructor(config) {
//         this.config = config
//         this.models = config.models ?? {}
//         this.seeds = config.seeds ?? {}
//         this.app = express()
//         this.app.use(cors())
//         this.app.use(express.json())

//     }

//     getItem(model, id) {
//         // return item with preloads

//         const item = this.data[model].find(i => i.id === id);

//         const preloads = Object.keys(this.validators[model]).map(key => {
//             const validators = this.validators[model][key]

//             for (let validator of validators) {
//                 if (validator.name === 'relation') {
//                     console.log('____', validator)

//                     const preload = this.data[validator.model].filter(i => {
//                         console.log('inside filter', i.id, i, item)

//                         console.log('test: ', id.id == item[key])

//                         // this.data[key]
//                         validator.getField(key)
//                         // return
//                     })


//                     // console.log({preload})
//                     if (!preload) {
//                         if (validator.multiple) {
//                             item[key] = []
//                         } else {
//                             item[key] = null
//                         }
//                     } else {
//                         item[key] = preload
//                     }
//                 }
//             }

//         })



//         return item

//     }

//     Service = {
//         create: ({ body, query, params, name }) => {
//             console.log(body)
//             console.log(this.validators)
//             const { data, errors } = validate(body, name)
//             if (errors) return errors

//             console.log({ data })
//             data.id = Math.floor(Math.random() * 1000)
//             this.data[name].push(data)
//             return data
//             //
//         },
//         update: ({ body, query, params, name }) => {
//             const { data, errors } = validate(body, name)
//             console.log(errors)
//             if (errors) return errors

//             console.log({ data })
//             this.data[name] = this.data[name].map(item => {
//                 console.log(item, data, params.id)
//                 if (item.id == params.id) {
//                     return { ...item, ...data }
//                 }
//                 return item
//             })
//         },
//         getAll: ({ body, query, params, name }) => {
//             // apply preloads
//             const data = this.data[name]
//             // return data;
//             return data.map(item => {
//                 return this.getItem(name, item.id)
//             })

//             // return data.map(item => {

//             //     // return {...item, }
//             // })
//         },
//         get: ({ body, query, params, name }) => {
//             return this.data[name].find(item => item.id == params.id)
//         },
//         remove: ({ body, query, params, name }) => {
//             this.data[name] = this.data[name].filter(item => item.id != params.id)
//         }
//     }

//     getServiceRouter(name) {
//         const router = express.Router()

//         function getOptions(req) {
//             return {
//                 body: req.body,
//                 params: req.params,
//                 query: req.query,
//                 name
//             }
//         }

//         // const methods = ['insert', 'update', 'remove', 'get', 'query'];

//         for (let method of Object.keys(this.Service)) {
//             console.log('add route', method)
//             router.post(`/${method}`, async (req, res) => {
//                 const output = await this.Service[method](getOptions(req))
//                 res.send(output)
//             })
//         }

//         return router
//     }

//     initData() {
//         this.data = {}
//         Object.keys(this.models).map(model => {
//             this.data[model] = []
//         })
//     }


//     seedSingle(name) {
//         const data = {}

//         Object.keys(this.models[name]).map(key => {
//             console.log(key)
//             const schema = this.models[name][key];

//             if (schema.startsWith('string')) {
//                 data[key] = 'some String'
//             } else if (schema.startsWith('enum')) {
//                 data[key] = schema.substring(5, schema.indexOf(','));
//             } else if (schema.startsWith('number')) {
//                 data[key] = Math.floor(Math.random() * 1000)
//             } else if (schema.startsWith('relation')) {
//                 data[key] = 1
//             }
//         })

//         if (!this.data[name]) this.data[name] = []
//         this.data[name].push(data)
//     }

//     seed(name, count) {
//         Array.from({ length: count }).map(() => this.seedSingle(name))
//     }

//     init() {
//         this.validators = initValidators(this.models)
//         // this.initRoutes(this.)

//         console.log(this.validators)

//         Object.keys(this.seeds).map(key => {
//             this.seed(key, this.seeds[key])
//         })

//         console.log('init routes')
//         Object.keys(this.models).map(model => {
//             console.log('this.models: ', this.models)
//             this.app.use(`/${model}`, this.getServiceRouter(model))
//         })
//     }

//     handler() {
//         this.init();
//         return async (req, res) => {
//             res.json({ hello: 'world' })
//         }
//     }

//     use(prefix, handler) {
//         this.app.use(prefix, handler)
//     }

//     express(port = 3000) {

//         console.log('init')
//         this.init()

//         // app.use('/', (req, res) => {res.send('Hello World!')})

//         this.app.listen(port, () => console.log(`listening on port ${port}`))
//         return this.app
//     }
// }

// module.exports = MiniApi