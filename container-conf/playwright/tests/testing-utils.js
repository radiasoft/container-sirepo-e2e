let fs = require("fs");
let exec = require('child_process').exec;

// be a function that returns appName. And maybe this should be an object.
export let HTTP_PREFIX = process.env.SIREPO_E2E_HTTP + "/";
export let EMAIL_ADDR = process.env.SIREPO_E2E_EMAIL;
let NEEDS_EMAIL_LOGIN = true;

export let textMatch = (pattern) => {
    return `text=${pattern}`
}

export let regexPattern = (pattern) => {
    return `/${pattern}/`
}

export let wholeWord = (pattern) => {
    return `^${pattern}$`
}

export let contentRe = (text) => {
    let t = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/, "\\s+");
    return textMatch(`/^\\s*${t}\\s*$/is`);
}

export let navigateToApp = async (page, appName) => {
    await page.goto(HTTP_PREFIX + appName);
}

export class MailManager {
    constructor(mailPath) {
        if (mailPath === "/" || mailPath.length == 0) {
            throw new Error(`invalid mailPath ${mailPath}`)
        }

        if (mailPath.substring(mailPath.length - 1, mailPath.length) === "/") {
            mailPath = mailPath.substring(0, mailPath.length - 1);
        }
        this.mailPath = mailPath;

        fs.accessSync(mailPath, fs.constants.R_OK | fs.constants.W_OK);
        let stats = fs.statSync(mailPath);
        if (!stats.isDirectory()) {
            throw new Error(`mailPath=${mailPath} did not point to directory`);
        }

        this.linkPattern = /https?:\/\/[^\/\s]+\/auth-email-authorized\/\w+\/\w+/i;
    }

    listMail = () => {
        return fs.readdirSync(this.mailPath);
    }

    mailAbsPath = (mailFile) => {
        return this.mailPath + "/" + mailFile;
    }

    getMailString = (mailFile) => {
        return fs.readFileSync(this.mailAbsPath(mailFile), { encoding: "utf-8" });
    }

    getSignInLink = (mailString) => {
        let matches = [...mailString.match(this.linkPattern),];
        if (matches.length < 1) {
            throw new Error(`could not find signin link in email: ${mailString}`);
        }

        return matches[0];
    }

    deleteEmail = (mailFile) => {
        fs.rmSync(this.mailAbsPath(mailFile));
    }

    deleteAllEmails = () => {
        for (let mailFile of this.listMail()) {
            fs.rmSync(this.mailAbsPath(mailFile));
        }
    }

    getFirstEmailLink = async (interval, retries) => {
        let mailNames = await this.waitForFile(interval, retries);
        if (mailNames.length > 1) {
            throw new Error(`multiple mail files were found: ${JSON.stringify(mailNames)}`);
        }

        if (mailNames.length < 1) {
            throw new Error("no mail files were found");
        }

        let mailString = this.getMailString(mailNames[0]);
        return this.getSignInLink(mailString);
    }

    waitForFile = async (interval, retries) => {
        let retriesLeft = retries;
        return await new Promise((resolve, reject) => {
            let t = setInterval(() => {
                let files = this.listMail();
                if (files.length > 0) {
                    clearInterval(t);
                    resolve(files);
                }
                else {
                    retriesLeft--;
                    if (retriesLeft < 0) {
                        clearInterval(t);
                        reject(new Error(`no files were present in mailPath=${this.mailPath} directory before timeout`));
                    }
                }
            }, interval)
        })
    }
}

function replaceHostname(link, newHost) {
    let hostnamePattern = /(http[s]?:\/\/.+?)\//g
    let matches = [...link.matchAll(hostnamePattern),]

    if (matches.length !== 1) {
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

export let loginIfNeeded = async (page, appName) => {
    if (NEEDS_EMAIL_LOGIN) {
        await loginWithEmail(page, appName);
    }
    else {
        await loginAsGuest(page, appName);
    }
}

export let loginAsGuest = async (page, appName) => {
    await page.goto(HTTP_PREFIX + appName + "#/login-with/guest");
}

export let loginWithEmail = async (page, appName, email=EMAIL_ADDR) => {
    let mailManager = new MailManager((await getUserHome()) + "/mail");
    mailManager.deleteAllEmails();

    await page.goto(HTTP_PREFIX + appName + "#/login-with/email");
    let emailFormGroup = page.locator(".form-group", { has: page.locator(contentRe("Your Email")) });
    await page.waitForTimeout(1000);
    await emailFormGroup.locator("input").type(email);
    await page.waitForTimeout(1000);
    await page.locator("button").locator(contentRe("Continue")).click();

    await page.goto(await mailManager.getFirstEmailLink(500, 30));

    await page.waitForTimeout(250);
    try {
        let continueButton = page.locator("button", { has: page.locator(contentRe("Confirm")) });
        await continueButton.waitFor({ state: 'attached', timeout: 2500 });
        await continueButton.click();
    }
    catch {
        await page.locator("input[name=displayName]").type("Test"); // TODO unique name
        await page.waitForTimeout(250);
        await page.locator("form .form-group button.btn-primary", { has: page.locator(contentRe("Submit")) }).click(); // this wont work for other apps, need to change page source to add new selectors
    }
    await page.waitForURL(`${HTTP_PREFIX}${appName}#/simulations`)
}

export let navigateToSimulation = async (page, simFolderNames) => {
    for (var path of simFolderNames) {
        //await page.waitForTimeout(1000);
        await page.locator("div.sr-thumbnail span")
        .locator(contentRe(path)).click();
        await page.waitForTimeout(500);
    }
}

export let navigateToFirstSimulation = async (page) => {
    let enterNextItem = async (page) => {
        let firstItemLocator = page.locator(".sr-icon-col div.sr-thumbnail", { has: page.locator("span.glyphicon") }).first();
        let isFolder = await (await firstItemLocator.elementHandle()).$eval("span.glyphicon", (node) => node.classList.contains("glyphicon-folder-close"));
        await firstItemLocator.first().dblclick();
        await page.waitForTimeout(250);
        if (isFolder) {
            await enterNextItem(page);
        }
    }

    await enterNextItem(page);
}

export let openSimulationOptionsMenu = async(page) => {
    await page.locator("a.dropdown-toggle > span.glyphicon.glyphicon-cog").click();
}

export let discardSimulationChanges = async(page) => {
    await openSimulationOptionsMenu(page);
    await page.locator(contentRe("Discard Changes to Example")).click();
    await page.locator("div.modal-dialog").locator(contentRe("Discard Changes")).click();
}

export let findPlotByTitle = (page, title) => {
    //return page.locator(`div[data-panel-title*="${title}"]`);
    return page.locator("div.panel", {has: page.locator(contentRe(title))});
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
    let [ download, ] = await Promise.all([
        page.waitForEvent("download"),
        downloadCausePromise
    ])
    return download;
}

export let downloadSimulationZip = async (page) => {
    await page.locator(".sr-settings-menu-toggle").click();
    await page.locator(contentRe("Export as ZIP")).click();
}

export let downloadPythonSource = async (page) => {
    await page.locator(".sr-settings-menu-toggle").click();
    await page.locator(contentRe("Python Source")).click();
}
