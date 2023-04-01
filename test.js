import { validate, initValidators } from "./validator.js";

initValidators({
    users: {
        id: 'string',
        name: 'string|email|required'
    },
    test: {
        id: 'number',
        status: 'enum(active,inactive)'
    }
})


console.log(validate({id: '1', name: 'ss@'}, 'users'))
console.log(validate({id: '1', name: 'test'}, 'users'))