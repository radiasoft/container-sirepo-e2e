const {} = require('@playwright/test');

const config = {
    testDir: './tests',
    use: {
        headless: false
    }
}

module.exports = config