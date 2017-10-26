'use strict';

let debug = false;

let all = true;

browser.storage.sync.get("all").then((item) => {
    all = item.all;
});

browser.runtime.onInstalled.addListener((details) => {
    browser.notifications.create({
        type: "basic",
        title: "Back to Close WE installed",
        iconUrl: "icon.svg",
        message: "Back to Close WE is now installed. Close newly opened tabs with a parent using the back button."
    });
    //TODO: Check that not already present
    browser.storage.sync.set({
        all: true
    });
});

let CLOSE_TAB = 'Close tab';

let source;
fetch(browser.runtime.getURL("script.js")).then((response) => {
    return response.text();
}).then((text) => {
    source = text.replace('__DEBUG__', debug).replace('__CLOSE_TITLE__', CLOSE_TAB);
});

let tabs = {};

function execute(tab) {
    debug && console.log("Attempting execution", tabs[tab.id]);
    if (!tab.url.startsWith('about:')) {
        browser.tabs.executeScript(tab.id, {
            code: source.replace('__PUSH_STATE__', tabs[tab.id].push),
            runAt: "document_start"
        }).then((result) => {
            debug && console.log('result', result);
        }, (error) => {
            debug && console.log('error', error, tab);
        });
    }
}

browser.tabs.onCreated.addListener((tab) => {
    debug && console.log("created", tab, all, tab.openerTabId || all);
    if (tab.openerTabId || all) {
        tabs[tab.id] = {
            push: true
        };
        execute(tab);
    }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    debug && console.log("updated", tab, changeInfo);
    if (changeInfo.hasOwnProperty("url") || changeInfo.status === "completed") {
        execute(tab);
    }
    if (tabs[tab.id] && tab.title !== CLOSE_TAB) {
        tabs[tab.id].title = tab.title;
    }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    debug && console.log("got messsage", message);
    if (message.closeMe) {
        browser.tabs.remove(sender.tab.id).then(() => {
            debug && console.log("removed", sender.tab);
        }, (error) => {
            debug && console.log("error removing tab", error, sender.tab);
        })
    } else if (message.pushed) {
        tabs[sender.tab.id].push = false;
        sendResponse({title: tabs[sender.tab.id].title});
    } else if (message.options) {
        browser.storage.sync.set({
            all: message.options.all
        });
        all = message.options.all;
    }
});