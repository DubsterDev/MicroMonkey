import { changeModel, createModel } from "./editor";
import { getFile, writeFile } from "./serial";

const tabs = {
    "/.default_files/micromonkey/hi.py": {
        "title": "Welcome to MicroMonkey",
        "type": "monaco",
        "model": createModel("# Open a file using the file explorer to get started\n# If there\'s nothing in it, connect to a board first.", 'file://.default_files/micromonkey/hi.py'),
        "active": true,
        "saved": true
    }
};

export function initializeOpenFilesManager() {
    renderTabs();
}

export async function openTab(path, title="", type="") {
    // Check if this tab is opened already, while deactivating the currently active tab
    Object.keys(tabs).forEach(path => {
        const tab = tabs[path];
        if (tab.active) {
            tab.active = false;
        }
    });
    if (path in tabs) {
        tabs[path].active = true;
    } else {
        const content = await getFile(path);
        const model = createModel(content, "file:/" + path);
        tabs[path] = {
            "title": title === "" ? path.split("/").at(-1) : title,
            "type": type === "" ? "monaco" : type,
            "model": model,
            "active": true,
            "saved": true
        };
    }

    renderTabs();
}

export function fileChanged(path) {
    tabs[path].saved = false;
    renderTabs();
}

export function saveActiveFile() {
    Object.keys(tabs).forEach(async path => {
        const tab = tabs[path];
        if (tab.active) {
            await writeFile(tab.model.getValue(), tab.path)
            tab.saved = true;
        }
    });
    renderTabs();
}

function renderTabs(activateActiveTab=true) {
    const tabsContainer = document.getElementById("tabs");
    tabsContainer.innerText = "";

    const tabPaths = Object.keys(tabs);
    tabPaths.forEach(path => {
        const tab = tabs[path];
        const tabContainer = document.createElement("div");
        tabContainer.dataset.path = path;
        tabContainer.classList.add("tab");

        if (tab.active) {
            tabContainer.classList.add("active");
        }

        const tabTitle = document.createElement("p");
        tabTitle.innerText = tab.title + (tab.saved ? "" : " (unsaved)");
        tabContainer.appendChild(tabTitle);

        const closeBtn = document.createElement("button");
        closeBtn.classList.add("material-symbols-outlined");
        closeBtn.innerText = "close";
        tabContainer.appendChild(closeBtn);

        closeBtn.addEventListener("click", (ev) => {
            tab.model.dispose();
            delete tabs[path];
            const tabKeys = Object.keys(tabs);
            if (tab.active && tabKeys.length > 0) tabs[tabKeys[tabKeys.length - 1]].active = true;
            renderTabs();
            ev.stopPropagation();
        });

        tabContainer.addEventListener("click", () => {
            Object.keys(tabs).forEach(aTabPath => {
                const aTab = tabs[aTabPath];
                if (aTab.active) {
                    aTab.active = false;
                }
            });
            tab.active = true;
            renderTabs();
            changeModel(tab.model);
        });

        tabsContainer.appendChild(tabContainer);

        if (activateActiveTab && tab.active) {
            changeModel(tab.model);
        }
    })
}