const {} = require('@playwright/test');

const config = {
    testDir: './tests',
    use: {
        headless: true
    }
}

module.exports = config
