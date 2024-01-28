'use strict';

let debug = false;

let opts = {
    all: undefined,
    closetabtitle: undefined,
    tampermonkeyfix: undefined
};

browser.storage.sync.get(opts).then((item) => {
    Object.assign(opts, item);
    debug && console.log("opts", opts);
    load();

    let defs = {
        all: true,
        closetabtitle: true,
        tampermonkeyfix: false
    };
    for (let def of Object.keys(defs)) {
        if (opts[def] === undefined || opts[def] === null) {
            browser.storage.sync.set({
                [def]: defs[def]
            }).then(() => {
                load();
            });
        }
    }
});

browser.storage.onChanged.addListener((changes) => {
    for (let change of Object.keys(changes)) {
        opts[change] = changes[change].newValue;
    }
    debug && console.log("opts", opts);
    load();
});

// ZERO WIDTH SPACE to make title unique but still display pretty
// Didn't need it after all, but could come in handy
let CLOSE_TAB = 'Close\u200b \u200btab';
let source;
let tabs = {};

function load() {
    fetch(browser.runtime.getURL("script.js")).then((response) => {
        return response.text();
    }).then((text) => {
        source = text.replace('__DEBUG__', debug).replace('__CLOSE_TITLE__', opts.closetabtitle ? ('"' + CLOSE_TAB + '"') : 'false');
    });
}

load();

function execute(tab) {
    debug && console.log("Attempting execution", tabs[tab.id]);
    if (!tab.url.startsWith('about:')) {
        browser.tabs.executeScript(tab.id, {
            code: source.replace('__PUSH_STATE__', tabs[tab.id].push).replace('__REQUIRED_LENGTH__', tabs[tab.id].newtab ? (opts.tampermonkeyfix + 2) : (opts.tampermonkeyfix + 1)),
            runAt: "document_start"
        }).then((result) => {
            debug && console.log('result', result);
        }, (error) => {
            debug && console.log('error', error, tab);
        });
    }
}

browser.tabs.onCreated.addListener((tab) => {
    debug && console.log("created", tab, opts, tab.openerTabId || opts.all);
    if (tab.openerTabId || opts.all) {
        tabs[tab.id] = {
            push: true,
            newtab: tab.url === "about:newtab"
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
        debug && console.log('Title', tabs[tab.id].title, '=>', tab.title);
        tabs[tab.id].title = tab.title;
    }
});

browser.runtime.onMessage.addListener((message, sender) => {
    debug && console.log("got messsage", message);
    if (message.closeMe) {
        browser.tabs.remove(sender.tab.id).then(() => {
            debug && console.log("removed", sender.tab);
        }, (error) => {
            debug && console.log("error removing tab", error, sender.tab);
        })
    } else if (message.pushed || message === false /* not undefined */) {
        debug && console.log('pushed');
        tabs[sender.tab.id].push = message.pushed;
        debug && console.log('Sending title back to tab');
        browser.tabs.sendMessage(sender.tab.id, {title: tabs[sender.tab.id].title});
        // Possibly delete history entry?
    }
});