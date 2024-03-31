'use strict'
const Jasmine = require('jasmine')
const runner = new Jasmine();
const { SpecReporter, DisplayProcessor, StacktraceOption } = require('jasmine-spec-reporter')


class CustomProcessor extends DisplayProcessor {
    /* Other customizations */
}

const customReporter = new SpecReporter({
    customProcessors: [CustomProcessor],
    suite: { displayNumber: false },
    spec: {
        displayDuration: true,
        displayErrorMessages: true,
        displayStacktrace: StacktraceOption.PRETTY,
        displaySuccessful: true,
        displayFailed: true,
        displayPending: false
    },
    summary: {
        displaySuccessful: false,
        displayFailed: true,
        displayPending: false,
        //displayStacktrace: StacktraceOption.PRETTY,
        displayDuration: true
    },
    stacktrace: {
    },
    print: function (log) {
        if (log.length > 0) console.log(log);
    }
})


runner.loadConfigFile('spec/support/jasmine.json')
runner.configureDefaultReporter({ print: function () {} })// turn off default reporter output
runner.addReporter(customReporter)
runner.exitOnCompletion = false; //allow execute() to return a Promise
(async function exec() {
    const result = await runner.execute();
    if (result.overallStatus === 'passed') {
        console.log('\x1b[32m%s\x1b[0m', 'All specs have passed.');
    } else {
        console.log('\x1b[31m%s\x1b[0m', 'At least one spec has failed.');
    }
})()
