let validators = {}

function enumRule(schema) {
    const itemsStr = schema.substring(5, schema.indexOf(')'))
    const items = itemsStr.split(',')
        
    return {
        name: 'enum', 
        validate: (value) => typeof value === 'string' && items.includes(value) ? value : undefined
    }
} 

function requiredRule() {
    return {
        name: 'required', 
        validate: (value) => {
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

const allRules = {
    required: requiredRule,
    string: stringRule,
    number: numberRule,
    email: emailRule,
    enum: enumRule
}


function getValidators(rules) {
    return rules.map(rule => {
        if(typeof rule === 'function') {
            return value => rule(value)
        } else if(typeof rule === 'string') {
            if(rule.startsWith('enum')) {
                return allRules['enum'](rule)
            } else {
                return allRules[rule]()
            }
        }
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
}

exports.validate = function(object, model) {
    let data = null
    let errors = null    

    for(let field of Object.keys(validators[model])) {
        let value = object[field]

        for(const validator of validators[model][field]) {
            try {
                value = validator.validate(value)    
            } catch(err) {
                if(!errors) errors = {}
                errors[field] = err.message
                value = undefined
                break;
            }
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
