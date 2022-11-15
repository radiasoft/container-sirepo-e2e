let fs = require("fs");
let exec = require('child_process').exec;

let HOST_PROTOCOL = "http"
let HOST_BASE = "localhost:8000"
let HOST = HOST_PROTOCOL + "://" + HOST_BASE;

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

export class MailManager {
    constructor(mailPath) {
        if(mailPath === "/" || mailPath.length == 0) {
            throw new Error(`invalid mailPath ${mailPath}`)
        }

        if(mailPath.substring(mailPath.length - 1, mailPath.length) === "/") {
            mailPath = mailPath.substring(0, mailPath.length - 1);
        }
        this.mailPath = mailPath;

        this.linkPattern = /^\s*(http.+?auth-email-authorized.+?)\s*$/gm;
    }

    listMail = () => {
        let fileNames = fs.readdirSync(this.mailPath);
        return fileNames;
    }
 
    getFullPath = (mailFile) => {
        return this.mailPath + "/" + mailFile;
    }

    getMailString = (mailFile) => {
        return fs.readFileSync(this.getFullPath(mailFile), { encoding: "utf-8" });   
    }

    getSignInLink = (mailString) => {
        let matches = [...mailString.matchAll(this.linkPattern)];
        if(matches.length < 1) {
            throw new Error("could not find signin link in email '" + mailString + "'");
        }
        if(matches.length > 1) {
            throw new Error(`found multiple (${matches.length}) matches for signin link in email '${mailString}'`);
        } 

        return matches[0][1];
    }

    deleteEmail = (mailFile) => {
        fs.rmSync(this.getFullPath(mailFile));
    }

    deleteAllEmails = () => {
        fs.rmSync(this.getFullPath("*"));
    }

    getFirstEmailLink = () => {
        let mailNames = this.listMail();
        if(mailNames.length > 0) {
            throw new Error(`multiple mail files were found: ${JSON.stringify(mailNames)}`);
        }

        if(mailNames.length == 0) {
            throw new Error("no mail files were found");
        }

        let mailString = this.getMailString(mailNames[0]);
        return this.getSignInLink(mailString);
    }
}

function replaceHostname(link, newHost) {
    let hostnamePattern = /(http[s]?:\/\/.+?)\//g
    let matches = [...link.matchAll(hostnamePattern)]

    if(matches.length !== 1) {
        throw new Error(`hostname replacement expected exactly one match for hostname pattern: link=${link}`);
    }

    let matchedHostname = matches[0][1];
    return link.replace(matchedHostname, newHost);
}

async function getUserHome() {
    let homePromise = new Promise((resolve, reject) => {
        exec('echo ~',
            function (error, stdout, stderr) {
                if (error !== null) {
                    reject(error)
                }
                resolve(stdout.trim());
            });
    })

    return await homePromise;
}

export let loginWithEmail = async (page, applicationName, email="vagrant+test@localhost.localdomain") => {
    await page.goto(HOST + "/" + applicationName + "#/login-with/email");

    let emailFormGroup = page.locator(".form-group", { has: page.locator(textFuzzyEquals("Your Email")) });
    await page.waitForTimeout(1000);
    await emailFormGroup.locator("input").type(email);
    await page.waitForTimeout(1000);
    await page.locator("button").locator(textFuzzyEquals("Continue")).click();

    await page.waitForTimeout(1000);

    let mailManager = new MailManager((await getUserHome()) + "/mail");
    let link = replaceHostname(mailManager.getFirstEmailLink(), HOST);
    mailManager.deleteAllEmails();

    await page.goto(link);
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
