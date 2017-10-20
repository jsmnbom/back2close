browser.storage.sync.get("all").then((item) => {
    document.getElementById("all").checked = item.all;
});

document.getElementById("all").addEventListener("change", function(e) {
    browser.runtime.sendMessage({
        options: {
            all: this.checked
        }
    });
});