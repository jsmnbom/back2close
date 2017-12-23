(function () {
    'use strict';
    let debug = __DEBUG__;
    let title = "__CLOSE_TITLE__";

    debug && console.log("Current state", history.state);
    debug && console.log("Current length", history.length);

    if (window.__BACK_INIT) {
        debug && console.log("Cancelling due to __BACK_INIT");
        return;
    }
    window.__BACK_INIT = true;

    debug && console.log("Adding event listener");
    window.addEventListener('popstate', (event) => {
        debug && console.log('popped', event);
        if (event.state && event.state.BACK_CLOSE) {
            history.forward();
            browser.runtime.sendMessage({
                closeMe: true
            });
        }
    });

    debug && console.log("history length", history.length);

    if (__PUSH_STATE__ && history.length === __REQUIRED_LENGTH__) {
        debug && console.log("Pushing state!");
        let stateObj = {BACK_CLOSE: true};
        window.setTimeout(() => {
            document.title = title;
            history.replaceState(stateObj, null, window.location.href + "#");
            debug && console.log("before push length", history.length);
            let before = history.length;
            window.setTimeout(() => {
                history.pushState(null, null, window.location.href.slice(-1) === "#" ? window.location.href.slice(0, -1) : window.location.href);
                debug && console.log("after push length", history.length);
                if (before + 1 === history.length) {
                    browser.runtime.sendMessage({
                        pushed: true
                    }).then((response) => {
                        debug && console.log("response", response);
                        document.title = response.title;
                    });
                }
            });
        });
    }
}());
