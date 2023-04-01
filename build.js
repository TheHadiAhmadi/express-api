const rollup = require('rollup')
const resolve = require('rollup-plugin-node-resolve')
const common = require('rollup-plugin-commonjs')

const output = rollup.rollup({
    input: ['./index.js'],
    external: ['express', 'cors'],
    plugins: [
        resolve(),
        common()
    ]
})


output.then(value => {
    value.write({
        format: 'commonjs',
        dir: './build'
    }).then((res => {
        console.log('\n\n\n\tnode build/index.js\n\n\n')
    }))
})