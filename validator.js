let validators = {}

function enumRule(options) {
    // const itemsStr = schema.substring(5, schema.indexOf(')'))
    // const items = itemsStr.split(',')
        
    return {
        name: 'enum', 
        validate: (value) => typeof value === 'string' && options.includes(value) ? value : undefined
    }
} 

function requiredRule() {
    return {
        name: 'required', 
        validate: (value) => {
            console.log('required', typeof value, value)
            if(typeof value !== 'undefined') {
                return value;
            } else {
                throw Error('This field is required')
            }
        
        }
    }
}

function emailRule() {
    return {
        name: 'email',
        validate: (value) => {
            if(typeof value === 'undefined') return;
            if(typeof value === 'string' && value.indexOf('@') > -1) {
                return value
            } else {
                throw Error('This should be email')
            }
        
        }
    }
}

function stringRule() {
    return {
        name: 'string', 
        validate: (value) => {

            if(typeof value === 'undefined') return;
            if(typeof value === 'string') {
                return value
            } else {
                throw Error('This should be string')
            }
        }
    }
}

function numberRule() {
    return {
        name: 'number', 
        validate: (value) => {
            console.log('validate number', value)
            if(typeof value === 'undefined') return;
            if(typeof value === 'number') {
                return value
            } else if(typeof value === 'string' && !isNaN(value)) {
                return Number(value)
            } else {
                throw Error('This should be number') 
            }        
        }
    }
}

function defaultRule(options) {
    return {
        name: 'default',
        validate: (value) => {
            if(typeof value === 'undefined') {
                if(!options[0].startsWith('"') && !options[0].startsWith('[') && !options[0].startsWith('{'))
                    return options[0]
                else if(!isNaN(options[0])) {
                    return Number(options[0])
                } else {
                    return JSON.parse(options[0])
                }
            } else {
                return value;
            }
        }
    }
}

function relationRule(option) {
    const multiple = option[0].endsWith('[]')

    const model = multiple ? option[0].substring(0, option[0].length - 2) : option[0]

    function withId(string) {
        return option[1] ?? string + '_id'
    }

    function withIds(string) {
        return option[1] ?? string.substring(0, string.length - 1) + '_ids'
    }
    

    console.log('relation ', option[0], model)
    
    return {
        name: 'relation',
        validate: (value) => {
            if(value === 'undefined') return;

            if(multiple) {
                // it should be array
                if(Array.isArray(value)) {
                    return value
                } else {
                    throw Error('This should be array if ids')
                }
            } else {
                // it should be number
                if(typeof value === 'string' && !isNaN(value)) {
                    return Number(value)
                } 
                if(typeof value === 'number') {
                    return value
                }
            }
            
            return value
            // this relation should exist
        },
        model,
        multiple,
        getField: (field) => multiple ? withIds(field) : withId(field) 
    }
}

const allRules = {
    required: requiredRule,
    string: stringRule,
    number: numberRule,
    email: emailRule,
    enum: enumRule,
    default: defaultRule,
    relation: relationRule
}


function getValidators(rules) {
    return rules.map(rule => {

        
        let options = null

        if(rule.indexOf('(') > -1) {
            const optionsStr = rule.substring(rule.indexOf('(') + 1, rule.indexOf(')'))
         
            rule = rule.substring(0, rule.indexOf('('))
            options = optionsStr.split(',').map(str => str.trim())
        }
        console.log(rule)
        
        return allRules[rule](options)
    })
}


function parseRules(rulesStr) {
    const rules = rulesStr.split('|')

    return getValidators(rules)    
}

exports.initValidators = function(models) {
    for(let model of Object.keys(models)) {
        validators[model] = {}

        for(let field of Object.keys(models[model])) {        
            validators[model][field] = parseRules(models[model][field])
        }
    }
    return validators;
}

exports.validate = function(object, model) {
    let data = null
    let errors = null    

    console.log('validate', object, model)
    for(let field of Object.keys(validators[model])) {
        let value = object[field]
        console.log('validate for', field, value)

        const [firstValidator, ...restValidators] = validators[model][field];
        const getField = firstValidator.getField ?? ((field) => field)

        field = getField(field)
        try {
            console.log('try validate', value, field, firstValidator.name)
            value = firstValidator.validate(object[field])
        
            for(const validator of restValidators) {
                value = validator.validate(value)    
            }

        } catch(err) {
            // 
            if(!errors) errors = {}
            errors[field] = err.message
            value = undefined
            break;
        }

        if(typeof value !== 'undefined') {
            if(!data) data = {}
            data[field] = value
        }
    }

    if(errors === null && data === null) {
        data = {}
    }

    return { data, errors }
}
