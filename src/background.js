'use strict';

let debug = false;

let all = true;

browser.storage.sync.get("all").then((item) => {
    all = item.all;
});

browser.runtime.onInstalled.addListener((details) => {
    browser.notifications.create({
        type: "basic",
        title: "Back to Close Installed",
        iconUrl: "icon.svg",
        message: "Back to Close is now installed. Close newly opened tabs with a parent using the back button."
    });
    browser.storage.sync.set({
        all: true
    });
});

let source;
fetch(browser.runtime.getURL("script.js")).then((response) => {
    return response.text();
}).then((text) => {
    source = text.replace('__DEBUG__', debug);
});

let toPushState = new Set();

function execute(tab) {
    debug && console.log("Attempting execution");
    if (!tab.url.startsWith('about:')) {
        browser.tabs.executeScript(tab.id, {
            code: source.replace('__PUSH_STATE__', toPushState.has(tab.id)),
            runAt: "document_start"
        }).then((result) => {
            toPushState.has(tab.id) && toPushState.delete(tab.id);
            debug && console.log('result', result);
        }, (error) => {
            debug && console.log('error', error, tab);
        });
    }
}

browser.tabs.onCreated.addListener((tab) => {
    debug && console.log("created", tab, all, tab.openerTabId || all);
    if (tab.openerTabId || all) {
        toPushState.add(tab.id);
        execute(tab);
    }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    debug && console.log("updated", tab, changeInfo);
    if (changeInfo.hasOwnProperty("url") || changeInfo.status === "completed") {
        execute(tab);
    }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.closeMe) {
        browser.tabs.remove(sender.tab.id).then(() => {
            debug && console.log("removed", sender.tab);
        }, (error) => {
            debug && console.log("error removing tab", error, sender.tab);
        })
    } else if (message.options) {
        browser.storage.sync.set({
            all: message.options.all
        });
        all = message.options.all;
    }
});