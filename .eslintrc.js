module.exports = {
    'env' : {
        'browser' : true,
        'commonjs' : true,
        'es2021' : true
    },
    'extends' : 'eslint:recommended',
    'overrides' : [
        {
            'env' : {
                'node' : true
            },
            'files' : [
                '.eslintrc.{js,cjs}'
            ],
            'parserOptions' : {
                'sourceType' : 'script'
            }
        }
    ],
    'parserOptions' : {
        'ecmaVersion' : 'latest'
    },
    'plugins' : [
        '@stylistic/js'
    ],
    'rules' : {
        'no-unused-vars' : [
            'warn'
        ],
        '@stylistic/js/indent' : [
            'warn',
            4
        ],
        'curly' : [
            2,
            'multi-line'
        ],
        '@stylistic/js/brace-style' : [
            'error'
        ],
        '@stylistic/js/no-multi-spaces' : [
            'error'
        ],
        '@stylistic/js/space-infix-ops' : [
            'error'
        ],
        '@stylistic/js/space-unary-ops' : [
            'error'
        ],
        '@stylistic/js/function-call-spacing' : [
            'error'
        ],
        '@stylistic/js/space-before-blocks' : [
            'error',
            'never'
        ],
        '@stylistic/js/space-in-parens' : [
            'error',
            'always',
            { 'exceptions' : [
                '{}'
            ] }
        ],
        '@stylistic/js/comma-spacing' : [
            'error',
            {
                'before' : false,
                'after' : true
            }
        ],
        '@stylistic/js/key-spacing' : [
            'error',
            {
                'beforeColon' : true,
                'afterColon' : true
            }

        ],
        '@stylistic/js/arrow-spacing' : [
            'error',
            {
                'before' : true,
                'after' : true
            }
        ],
        'linebreak-style' : [
            'error',
            'unix'
        ],
        'quotes' : [
            'error',
            'single'
        ],
        'semi' : [
            'error',
            'never'
        ]
    }
}