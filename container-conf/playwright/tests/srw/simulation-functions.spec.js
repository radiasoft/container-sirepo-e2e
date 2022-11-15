const { test, expect } = require('@playwright/test');
const { loginWithEmail, navigateToApplication, openPanelOptions, navigateToSimulation, textFuzzyEquals, findPlotByTitle, waitForPlotToLoad, getDownloadContents, navigateToFirstSimulation, discardSimulationChanges, waitForPlotLoading, startDownload, downloadSimulationZip, downloadPythonSource } = require('../testing-utils.js')

test('SRW Discard Changes To Example', async ({page}) => {
    await loginWithEmail(page, 'srw');
    await navigateToApplication(page, 'srw');
    await navigateToFirstSimulation(page);
    await discardSimulationChanges(page);
    await page.waitForTimeout(2000);
})

test('SRW Change Value On Example', async ({page}) => {
    await loginWithEmail(page, 'srw');
    await navigateToApplication(page, 'srw');
    await navigateToSimulation(page, ['Light Source Facilities', 'NSLS-II', 'NSLS-II CHX beamline', 'NSLS-II CHX beamline']);
    let plotLocator = await findPlotByTitle(page, 'Single-Electron Spectrum, 20.5m');
    await waitForPlotToLoad(plotLocator , 2 * 60 * 1000);
    const panelLocator = page.locator('div.panel', { has: page.locator(textFuzzyEquals('Idealized Undulator')) });
    const undulatorInput = panelLocator.locator('div.model-undulator-period input');
    await undulatorInput.selectText();
    await undulatorInput.type('18');
    await panelLocator.locator('.sr-btn-save-changes').click();
    await waitForPlotLoading(plotLocator, 10 * 1000);
})

const openNewFolderMenu = async (page) => {
    await page.locator('.sr-nav-new-folder').click();
}

const TEST_FOLDER_NAME = 'Test Folder';

const namedFolderLocator = (page, name) => {
    return page.locator('.sr-thumbnail-item', { has: page.locator(textFuzzyEquals(name))});
}

test('SRW Create & Delete Folder', async ({page}) => {
    await loginWithEmail(page, 'srw');
    await navigateToApplication(page, 'srw');
    await openNewFolderMenu(page);
    await page.waitForTimeout(1500); // garsuga TODO: why does a wait need to be placed here for input typing to work
    await page.locator('.sr-form-field', {has: page.locator(textFuzzyEquals('Folder Name'))}).locator('input').type(TEST_FOLDER_NAME);
    await page.locator('.modal-dialog', {has: page.locator('.modal-title').locator(textFuzzyEquals('New Folder'))}).locator('.sr-btn-save-changes').click();
    let testFolderLocator = namedFolderLocator(page, TEST_FOLDER_NAME);
    await testFolderLocator.waitFor({ state: 'visible' })
    await testFolderLocator.click();
    await testFolderLocator.locator('.dropdown-menu').locator(textFuzzyEquals('Delete')).click();
    await testFolderLocator.waitFor({ state: 'detached' })
})

test('SRW Plot2d Report Load and Raw Data Download', async ({ page }) => {
    await loginWithEmail(page, 'srw');
    await navigateToApplication(page, 'srw');
    test.slow();
    await navigateToSimulation(page, ['Light Source Facilities', 'NSLS-II', 'NSLS-II CHX beamline', 'NSLS-II CHX beamline'])
    await discardSimulationChanges(page);
    let plotLocator = await findPlotByTitle(page, 'Single-Electron Spectrum, 20.5m');
    let reportElement = await waitForPlotToLoad(plotLocator , 2 * 60 * 1000);
    await openPanelOptions(reportElement);
    let download = await startDownload(page, reportElement.locator(textFuzzyEquals('Raw Data File')).click());
    let readStream = await download.createReadStream();
    let downloadContent = await getDownloadContents(readStream);
});

test('SRW Download Simulation Zip', async({ page }) => {
    await loginWithEmail(page, 'srw');
    await navigateToApplication(page, 'srw');
    await navigateToFirstSimulation(page);
    let download = await startDownload(page, downloadSimulationZip(page));
    let readStream = await download.createReadStream();
    let downloadContent = await getDownloadContents(readStream);
})

test('SRW Download Python Source', async({ page }) => {
    await loginWithEmail(page, 'srw');
    await navigateToApplication(page, 'srw');
    await navigateToFirstSimulation(page);
    let download = await startDownload(page, downloadPythonSource(page));
    let readStream = await download.createReadStream();
    let downloadContent = await getDownloadContents(readStream);
})