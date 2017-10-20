'use strict';

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

let toExecute = new Set();

function execute(tab) {
    if (!tab.url.startsWith('about:')) {
        browser.tabs.executeScript(tab.id, {
            file: 'script.js'
        }).then((result) => {
            toExecute.delete(tab.id);
            console.log('result', result);
        }, (error) => {
            console.log('error', error, tab);
        });
    }
}

browser.tabs.onCreated.addListener((tab) => {
    console.log(all);
    if (tab.openerTabId || all) {
        toExecute.add(tab.id);
        execute(tab);
    }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (toExecute.has(tab.id)) {
        execute(tab);
    }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.closeMe) {
        browser.tabs.remove(sender.tab.id);
    } else if (message.options) {
        browser.storage.sync.set({
            all: message.options.all
        });
        all = message.options.all;
    }
});