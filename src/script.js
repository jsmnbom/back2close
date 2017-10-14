(function () {
    'use strict';
    if (window.__BACK_INIT) {
        return;
    }
    window.__BACK_INIT = true;

    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.BACK_CLOSE) {
            browser.runtime.sendMessage({
                closeMe: true
            });
        }
    });

    let stateObj = {BACK_CLOSE: true};
    let oldTitle = document.title;
    document.title = "Close tab";
    history.replaceState(stateObj, null, window.location);
    window.setTimeout(() => {
        history.pushState(null, null, window.location);
        document.title = oldTitle;
    }, 10);
}());
