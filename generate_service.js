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
}
function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1)
}


function generateTs(services) {

    let result = ''

    result += `type BaseFields = {\n\tid: number;\n\tcreatedAt: string;\n\tupdatedAt: string;\n};\n\n`;
    for (let name of Object.keys(services)) {

        nameArr = name.split('_');

        const typeName = nameArr.map(capitalize).join('')

        function getTypeName(type) {

        }


        result += `type ${typeName}Request = {\n`
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

            let field = services[name][fieldName]

            result += `\t${getFieldKey(field)}: ${getFieldValue(field)};\n`
        }

        result += '};\n'

        result += `type ${typeName} = ${typeName}Request & BaseFields;\n\n`
    }
    return result

}

module.exports = generateTs
console.log(generateTs(object))
/*


type BaseFields = {
        id: number;
        createdAt: string;
        updatedAt: string;
};

type TestUserRequest = {
        name: string;
        email: string;
        age?: number;
        todos?: Todo[];
};
type TestUser = TestUserRequest & BaseFields;

type TodoRequest = {
        title?: string;
        status?: 'done' | 'progress' | 'cancelled' | 'new';
};
type Todo = TodoRequest & BaseFields;



class BaseService<FullType, PartialType> {
    path: string;
    constructor(path: string) {
        this.path = path
    }
    async insert(data: PartialType): Promise<FullType> {
        return {
            id: 1,
            createdAt: '',
            updatedAt: '',
            ...data 
        } as FullType
    }
}


class TestUserService extends BaseService<TestUser, TestUserRequest> {
    constructor() {
        super(`/test_users`)
    }
}
*/