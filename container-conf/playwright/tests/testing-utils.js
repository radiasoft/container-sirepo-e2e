let HOST = "http://localhost:8000"

let textMatch = (pattern) => {
    return `text=${pattern}`
}

let regexPattern = (pattern) => {
    return `/${pattern}/`
}

let wholeWord = (pattern) => {
    return `^${pattern}$`
}

let tolerateWhitespace = (pattern) => {
    return `\\s*${pattern}\\s*`
}

let textFuzzyEquals = (pattern) => {
    return textMatch(regexPattern(wholeWord(tolerateWhitespace(pattern))))
}

let navigateToApplication = async (page, applicationName) => {
    await page.goto(HOST + "/" + applicationName);
    //await page.waitForTimeout(1000);
    await page.locator(textFuzzyEquals("Sign in as Guest")).click();
}

let navigateToSimulation = async (page, simFolderNames) => {
    for(var path of simFolderNames) {
        //await page.waitForTimeout(1000);
        await page.locator("div.sr-iconset div.sr-thumbnail-item span")
        .locator(textFuzzyEquals(path)).click();
    }
}

let navigateToFirstSimulation = async (page) => {
    let enterNextItem = async (page) => {
        let firstItemLocator = page.locator("div.sr-iconset div.sr-thumbnail-item").first();
        let elementHandle = await firstItemLocator.elementHandle();
        let isFolder = await elementHandle.$eval(".sr-item-icon", (node) => node.classList.contains("sr-folder-icon"));
        await firstItemLocator.locator(".sr-thumbnail-title").first().click();
        if(isFolder) {
            await enterNextItem(page);
        }
    }

    await enterNextItem(page);
}

let openSimulationOptionsMenu = async(page) => {
    await page.locator(".sr-settings-menu-toggle").click();
}

let discardSimulationChanges = async(page) => {
    await openSimulationOptionsMenu(page);
    await page.locator(textFuzzyEquals("Discard Changes to Example")).click();
    await page.locator("div.modal-dialog").locator(textFuzzyEquals("Discard Changes")).click();
}

let findPlotByTitle = (page, title) => {
    //return page.locator(`div[data-panel-title*="${title}"]`);
    return page.locator("div.panel", {has: page.locator(textFuzzyEquals(title))});
}

let waitForPlotToLoad = async (plotLocator, timeout) => {
    await plotLocator.locator("css=div.sr-panel-loaded", {timeout}).click();
    return plotLocator;
}

let waitForPlotLoading = async (plotLocator, timeout) => {
    await plotLocator.locator("div.sr-panel-loading", {timeout}).click();
    return plotLocator;
}

let getDownloadContents = (readable) => {
    return new Promise((resolve, reject) => {
        const chunks = [];

        readable.on('readable', () => {
            let chunk;
            while (null !== (chunk = readable.read())) {
                chunks.push(chunk);
            }
        });
    
        readable.on('end', () => {
            const content = chunks.join('');
            resolve(content);
        });
    })
}

let openPanelOptions = async (panelLocator) => {
    let panelDownloadMenuButtonLocator = panelLocator.locator(".sr-panel-options .glyphicon-cloud-download").first();
    await panelDownloadMenuButtonLocator.click();
    return panelDownloadMenuButtonLocator;
}

let startDownload = async (page, downloadCausePromise) => {
    let [ download ] = await Promise.all([
        page.waitForEvent("download"),
        downloadCausePromise
    ])
    return download;
}

let downloadSimulationZip = async (page) => {
    await page.locator(".sr-settings-menu-toggle").click();
    await page.locator(textFuzzyEquals("Export as ZIP")).click();
}

let downloadPythonSource = async (page) => {
    await page.locator(".sr-settings-menu-toggle").click();
    await page.locator(textFuzzyEquals("Python Source")).click();
}

module.exports = {
    textFuzzyEquals,
    waitForPlotToLoad,
    waitForPlotLoading,
    navigateToApplication,
    navigateToSimulation,
    navigateToFirstSimulation,
    getDownloadContents,
    discardSimulationChanges,
    openPanelOptions,
    startDownload,
    findPlotByTitle,
    downloadSimulationZip,
    downloadPythonSource
}