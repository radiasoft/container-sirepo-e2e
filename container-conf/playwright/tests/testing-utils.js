let HOST = "http://localhost:8000"

export let textMatch = (pattern) => {
    return `text=${pattern}`
}

export let regexPattern = (pattern) => {
    return `/${pattern}/`
}

export let wholeWord = (pattern) => {
    return `^${pattern}$`
}

export let tolerateWhitespace = (pattern) => {
    return `\\s*${pattern}\\s*`
}

export let textFuzzyEquals = (pattern) => {
    return textMatch(regexPattern(wholeWord(tolerateWhitespace(pattern))))
}

export let navigateToApplication = async (page, applicationName) => {
    await page.goto(HOST + "/" + applicationName);
    //await page.waitForTimeout(1000);
    //await page.locator(textFuzzyEquals("Sign in as Guest")).click();
    // localhost.localdomain
}

export let loginWithEmail = async (page, applicationName, email="localhost.localdomain") => {
    await page.goto(HOST + "/" + applicationName + "#/login-with/email");

    let emailFormGroup = page.locator(".form-group", { has: page.locator(textFuzzyEquals("Your Email")) });
    await emailFormGroup.locator(".input").type(email);
    await page.locator(".button").locator(textFuzzyEquals("Continue")).click();
}

export let navigateToSimulation = async (page, simFolderNames) => {
    for(var path of simFolderNames) {
        //await page.waitForTimeout(1000);
        await page.locator("div.sr-iconset div.sr-thumbnail-item span")
        .locator(textFuzzyEquals(path)).click();
    }
}

export let navigateToFirstSimulation = async (page) => {
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

export let openSimulationOptionsMenu = async(page) => {
    await page.locator(".sr-settings-menu-toggle").click();
}

export let discardSimulationChanges = async(page) => {
    await openSimulationOptionsMenu(page);
    await page.locator(textFuzzyEquals("Discard Changes to Example")).click();
    await page.locator("div.modal-dialog").locator(textFuzzyEquals("Discard Changes")).click();
}

export let findPlotByTitle = (page, title) => {
    //return page.locator(`div[data-panel-title*="${title}"]`);
    return page.locator("div.panel", {has: page.locator(textFuzzyEquals(title))});
}

export let waitForPlotToLoad = async (plotLocator, timeout) => {
    await plotLocator.locator("css=div.sr-panel-loaded", {timeout}).click();
    return plotLocator;
}

export let waitForPlotLoading = async (plotLocator, timeout) => {
    await plotLocator.locator("div.sr-panel-loading", {timeout}).click();
    return plotLocator;
}

export let getDownloadContents = (readable) => {
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

export let openPanelOptions = async (panelLocator) => {
    let panelDownloadMenuButtonLocator = panelLocator.locator(".sr-panel-options .glyphicon-cloud-download").first();
    await panelDownloadMenuButtonLocator.click();
    return panelDownloadMenuButtonLocator;
}

export let startDownload = async (page, downloadCausePromise) => {
    let [ download ] = await Promise.all([
        page.waitForEvent("download"),
        downloadCausePromise
    ])
    return download;
}

export let downloadSimulationZip = async (page) => {
    await page.locator(".sr-settings-menu-toggle").click();
    await page.locator(textFuzzyEquals("Export as ZIP")).click();
}

export let downloadPythonSource = async (page) => {
    await page.locator(".sr-settings-menu-toggle").click();
    await page.locator(textFuzzyEquals("Python Source")).click();
}
