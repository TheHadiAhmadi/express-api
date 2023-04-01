exports.ObjectMap = function (object, mapper) {
    const result = {}
    Object.keys(object).map(key => {
        result[key] = mapper(object[key], key)
    })
    return result
}
