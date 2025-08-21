import { changeModel, createModel } from "./editor";
import { getFile, writeFile } from "./serial";

const tabs = [
    {
        "title": "Welcome to MicroMonkey",
        "type": "monaco",
        "path": "/.default_files/micromonkey/hi.py",
        "model": createModel("# Open a file using the file explorer to get started\n# If there\'s nothing in it, connect to a board first.", 'file://.default_files/micromonkey/hi.py'),
        "active": true,
        "saved": true
    }
];

export function initializeOpenFilesManager() {
    renderTabs();
}

export async function openTab(path, title="", type="") {
    // Check if this tab is opened already, while deactivating the currently active tab
    let foundExistingTab = false;
    tabs.forEach(tab => {
        if (tab.path === path) {
            foundExistingTab = true;
            tab.active = true;
        } else if (tab.active) {
            tab.active = false;
        }
    });

    if (!foundExistingTab) {
        const content = await getFile(path);
        const model = createModel(content, "file:/" + path);
        tabs.push({
            "title": title === "" ? path.split("/").at(-1) : title,
            "type": type === "" ? "monaco" : type,
            "path": path,
            "model": model,
            "active": true,
            "saved": true
        });
    }

    renderTabs();
}

export function fileChanged(path) {
    tabs.forEach(tab => {
        if (tab.path === path) {
            tab.saved = false;
        }
    });
    renderTabs();
}

export function saveActiveFile() {
    tabs.forEach(async tab => {
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

    tabs.forEach(tab => {
        const tabContainer = document.createElement("div");
        tabContainer.dataset.path = tab.path;
        tabContainer.classList.add("tab");

        if (tab.active) {
            tabContainer.classList.add("active");
        }

        const tabTitle = document.createElement("p");
        tabTitle.innerText = tab.title + (tab.saved ? "" : " (unsaved)");
        tabContainer.appendChild(tabTitle);

        tabContainer.addEventListener("click", () => {
            tabs.forEach(aTab => {
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