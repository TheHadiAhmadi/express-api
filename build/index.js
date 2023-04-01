'use strict';

var express = require('express');

const object = {
    test_user: {
        "name": {
            "type": "string",
            "label": "Name",
            "required": true,
            "pattern": "[a-zA-Z_]",
            "filterable": true,
            "sortable": true
        },
        "email": {
            "type": "string",
            "label": "Email",
            "required": true,
            "filterable": true,
            "sortable": true
        },
        "age": {
            "type": "number",
            "label": "Age",
            "min": 18,
            "filterable": true,
            "sortable": true
        },
        "todos": {
            "type": "array",
            "label": "Todos",
            "items": "todo",
            "filterable": true,
            "sortable": true
        }
    },
    todo: {
        "title": {
            "type": "string",
            "filterable": true,
            "sortable": true
        },
        "status": {
            "type": "enum",
            "items": [
                "done",
                "progress",
                "cancelled",
                "new"
            ],
            "filterable": true,
            "sortable": true
        }
    }
};
function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1)
}


function generateTs(services) {

    let result = '';

    result += `type BaseFields = {\n\tid: number;\n\tcreatedAt: string;\n\tupdatedAt: string;\n};\n\n`;
    for (let name of Object.keys(services)) {

        let nameArr = name.split('_');

        const typeName = nameArr.map(capitalize).join('');


        result += `type ${typeName}Request = {\n`;
        for (let fieldName of Object.keys(services[name])) {
            function getFieldKey(field) {
                return `${fieldName}${field.required ? '' : '?'}`
            }

            function getFieldValue(field) {
                if (field.type == 'string' || field.type === 'number') {
                    return field.type;
                } else if (field.type === 'enum') {
                    return field.items.map(item => `'${item}'`).join(' | ');
                } else if (field.type === 'array') {
                    return getFieldValue({ type: field.items, items: 'TODO' }) + '[]'
                } else {
                    return capitalize(field.type)
                }
            }

            let field = services[name][fieldName];

            result += `\t${getFieldKey(field)}: ${getFieldValue(field)};\n`;
        }

        result += '};\n';

        result += `type ${typeName} = ${typeName}Request & BaseFields;\n\n`;
    }
    return result

}

var generate_ts = generateTs;
console.log(generateTs(object));

const BaseService = {

    extend(methods) {
        return { ...this, ...methods }
    },
    async insert(ctx) {
        const data = validate(ctx.fields, ctx.body);
        // validate
        console.log(data);
        return await ctx.model.insert(data)
    },
    async update(ctx) {
        return await ctx.model.update(ctx.body.id, ctx.body);
        // await db('users').create()
    },
    async remove(ctx) {
        return await ctx.model.remove(ctx.body.id)
        // await db('users').create()
    },
    async query(ctx) {
        console.log(ctx);
        return await ctx.model.query(ctx.body)
        // await db('users').create()
    },
    async get(ctx) {
        // await db('users').create()
    },
    fields(ctx) {
        console.log(ctx);
        return ctx.fields
    }
};


// BaseService.extend = function (methods) {
//     return { ...this, ...methods }
// }

const UserService = BaseService.extend({

    async test(ctx) {
        console.log('options', ctx);
        return 'Hello TEST';
    }
});

const TodoService = UserService.extend({
    async todo(options) {
        console.log('options');
        return 'Hello TEST';
    }
});


// import express from 'express'
const config = {
    services: {
        users: {
            service: UserService,
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
            service: TodoService,
            fields: {
                title: { type: 'string', filterable: true, sortable: true },
                status: { type: 'enum', items: ["done", 'progress', 'cancelled', 'new'], filterable: true, sortable: true },
            }
        }
    },
    port: 3000,
    db: 'https://minibase-db-2.vercel.app'

};

function validateRow(field, value, name) {
    if (typeof value === 'undefined' && field.required) {
        throw new Error(name + ' is required')
    }

    if (typeof value === 'string' && field.type === 'number') {
        if (isNaN(value)) throw new Error(name + ' should be number')
        value = Number(value);
    }

    if (field.type === 'string') {
        value = value.toString();
    }

    if (field.type === 'string' && field.pattern) {
        isValid = new RegExp(field.pattern).test(value);
        if (!isValid) throw new Error(name + ' doesnt match pattern ' + field.pattern)
    }

    return value;
}

function validate(fields, data) {
    let validatedData = {};
    Object.keys(fields).map(fieldName => {

        const row = validateRow(fields[fieldName], data[fieldName], fieldName);
        if (row) {
            validatedData[fieldName] = row;
        }

    });

    return validatedData;
}


async function getDbSchema(url) {
    return fetch(url + '/schema', {
        method: 'POST',
    }).then(res => res.json())
}

async function migrateDb(url, migration) {

    console.log('migrate: ', url, migration);
    return fetch(url + '/migrate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: migration.type,
            name: migration.name,
            columns: migration.columns.map(column => ({
                name: column.name,
                type: column.type === 'enum' ? 'string' : column.type
            }))
        })
    }).then(res => res.json())
}

const MiniApi = (config) => {
    let app;
    let dbSchema = {};

    function initRoutes(name, service) {
        console.log(name, Object.keys(service));
        for (let method of Object.keys(service)) {
            console.log(name, method);
            if (method === 'extend') continue;

            const getdb = (table) => ({
                insert: (data) => {
                    data.createdAt = new Date().toISOString();
                    data.updatedAt = new Date().toISOString();
                    console.log(data, config.db + '/' + table);
                    return fetch(config.db + '/' + table, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    }).then(res => res.json())
                },
                update: (id, data) => {
                    data.updatedAt = new Date();
                    console.log(data, config.db + '/' + table + '/' + id);
                    return fetch(config.db + '/' + table + '/' + id, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    }).then(res => res.json())

                },
                remove: (id) => {
                    console.log(config.db + '/' + table + '/' + id);
                    return fetch(config.db + '/' + table + '/' + id, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                    }).then(res => res.json())
                },
                query: async (body) => {
                    console.log(body.filters);
                    let query = `?sort=${body.sort ?? ''}&page=${body.page ?? ''}&filters=${body.filters ?? ''}&perPage=${body.perPage ?? ''}`;
                    console.log(config.db + '/' + table + query);
                    return fetch(config.db + '/' + table + query, {
                        method: 'GET'
                    }).then(res => res.json())
                },
                get: console.log,
            });


            app.get(`/${name}/${method}`, async (req, res) => {

                function getOptions(req) {
                    return {
                        body: { ...req.body, ...req.query },
                        params: req.params,
                        query: req.query,
                        service: name,
                        models: Object.keys(config.services).map(getdb),
                        model: getdb(name),
                        fields: config.services[name]?.fields,
                    }
                }

                let output = await service[method](getOptions(req));
                res.send(output);
            });
        }
    }

    async function init() {
        dbSchema = await getDbSchema(config.db);
        console.log('dbSchema: ', dbSchema);

        const services = {};
        for (let name of Object.keys(config.services)) {
            services[name] = config.services[name].fields;
        }

        const SystemService = {
            ts: async (ctx) => {
                return generate_ts(services)
            },
            fields: async (ctx) => {
                return services
            }
        };

        initRoutes('system', SystemService);

        for (let name of Object.keys(config.services)) {

            initRoutes(name, config.services[name].service);

            console.log('dbSchema: ', dbSchema[name]);
            if (!dbSchema[name]) {
                // migration
                console.log('migrate: ', name);

                migrateDb(config.db, {
                    type: 'add-table',
                    name: name,
                    columns: [...Object.keys(config.services[name].fields).map(field => {
                        return {
                            name: field,
                            type: config.services[name].fields[field].type
                        }
                    }),
                    { name: 'createdAt', type: 'string' },
                    { name: 'updatedAt', type: 'string' }
                    ]
                });
            }
        }
    }

    async function _express() {
        app = express();

        await init();

        return app;
    }

    return {
        express: _express,
        init,
    }
};
const app = MiniApi(config);


app.express().then(app => app.listen(3000, () => console.log('App Started on port: ' + 3000)));
var expressApi = app;

module.exports = expressApi;
