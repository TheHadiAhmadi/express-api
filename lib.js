const { initValidators } = require('./validator.js')

const express = require('express')
const cors = require('cors')

class MiniApi {
    config = null
    models = null
    app = null
    constructor(config) {
        this.config = config
        this.models = config.models ?? {}
        this.app = express()
        this.app.use(cors())
        this.app.use(express.json())
    
    }

    init() {
        initValidators(this.config.models)
    }
    
    handler() {
        this.init();
        return async (req, res) => {
          res.json({hello: 'world'})  
        } 
    }

    express(port = 3000) {
        const app = express()
        
        app.use('/', this.handler())
        
        app.listen(port, () => console.log(`listening on port ${port}`))
        return app
    }
}

module.exports = MiniApi