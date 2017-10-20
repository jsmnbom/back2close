(function () {
    'use strict';
    let debug = __DEBUG__;

    if (window.__BACK_INIT) {
        return;
    }
    window.__BACK_INIT = true;

    debug && console.log("Adding event listener");
    window.addEventListener('popstate', (event) => {
        debug && console.log('popped', event);
        if (event.state && event.state.BACK_CLOSE) {
            browser.runtime.sendMessage({
                closeMe: true
            });
        }
    });

    if (__PUSH_STATE__) {
        debug && console.log("Pushing state!");
        let stateObj = {BACK_CLOSE: true};
        let oldTitle = document.title;
        document.title = "Close tab";
        history.replaceState(stateObj, null, window.location.href + "#");
        window.setTimeout(() => {
            history.pushState(null, null, window.location.href.slice(-1) === "#" ? window.location.href.slice(0, -1) : window.location.href);
            document.title = oldTitle;
        }, 100);
    }
}());
