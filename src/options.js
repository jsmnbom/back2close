for (let el of document.querySelectorAll('.option')) {
    browser.storage.sync.get(el.id).then((item) => {
        el.checked = item[el.id];
    });
    el.addEventListener('change', function(e) {
        browser.storage.sync.set({
            [el.id]: this.checked
        });
    });
}