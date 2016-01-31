module.exports = function(config){
    config.set({

        basePath : './',

        logLevel: config.LOG_DEBUG,

        files : [
            'pykit.js',
            'pykit.spec.js'
        ],

        exclude : [
        ],

        reporters: ['progress', 'coverage'],

        preprocessors: {
            "pykit.js": ['coverage']
        },

        autoWatch : false,

        frameworks: ['jasmine'],

        browsers : ['PhantomJS'],

        plugins : [
            'karma-jasmine',
            'karma-phantomjs-launcher',
            'karma-coverage'
        ]
    });
};