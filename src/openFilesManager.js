// Import functions from editor to change what is showing
import { changeModel, createModel } from "./editor";

// Functions to get files from the serial device and write files
import { getFile, writeFile } from "./serial";

// A object containing the open tabs
const tabs = {
    "/.default_files/micromonkey/hi.py": {
        "title": "Welcome to MicroMonkey",
        "type": "monaco",
        "model": createModel("# Open a file using the file explorer to get started\n# If there\'s nothing in it, connect to a board first.", 'file://micromonkey/.default_files/micromonkey/hi.py'),
        "active": true,
        "saved": true
    }
};

/**
 * Renders the tabs for the first time.
 */
export function initializeOpenFilesManager() {
    renderTabs();
}

/**
 * Opens or focuses a tab
 * @param {string} path The path of the file on the board
 * @param {string} title A name to be shown on the tab. If no name is provided, the last segment of the path is used
 * @param {string} type The type of editor to be shown. Currently the only option is `monaco`
 */
export async function openTab(path, title="", type="monaco") {
    // Check if this tab is opened already, while deactivating the currently active tab
    Object.keys(tabs).forEach(path => {
        const tab = tabs[path];
        if (tab.active) {
            tab.active = false;
        }
    });
    if (path in tabs) {
        // If the tab is already opened, activate it
        tabs[path].active = true;
    } else {
        // Get the file's content from the board
        const content = await getFile(path);

        // Create a monaco model for the file
        const model = createModel(content, "file://micromonkey" + path);

        // Add the tab to the list of tabs
        tabs[path] = {
            "title": title === "" ? path.split("/").at(-1) : title,
            "type": type,
            "model": model,
            "active": true,
            "saved": true
        };
    }

    // Render the tabs
    renderTabs();
}

/**
 * Used to change the tab to indicate it is unsaved
 * @param {string} path The path of the file that was changed
 */
export function fileChanged(path) {
    // If it already is unsaved, don't do anything
    if (!tabs[path].saved) return;

    // Mark the file as unsaved and render the tabs
    tabs[path].saved = false;
    renderTabs();
}

/**
 * Write the active file's content to the connected device
 */
export function saveActiveFile() {
    // Loop through the paths of open tabs
    Object.keys(tabs).forEach(async path => {
        // Get the tab object
        const tab = tabs[path];
        if (tab.active) {
            // If this is an active tab, write the file to the board
            await writeFile(tab.model.getValue(), path)

            // Mark it as saved
            tab.saved = true;

            // And render the tabs
            renderTabs();
        }
    });
}

/**
 * Renders the tabs in the tab strip and optionally activates the active tab's model in Monaco
 * @param {boolean} activateActiveTab Whether or not to change the model open in Monaco
 */
function renderTabs(activateActiveTab=true) {
    // Get and clear the tabs container
    const tabsContainer = document.getElementById("tabs");
    tabsContainer.innerText = "";

    // Loop through the paths of the tabs
    const tabPaths = Object.keys(tabs);
    tabPaths.forEach(path => {
        // Get the tab's object
        const tab = tabs[path];

        // Create a container for the tab
        const tabContainer = document.createElement("div");
        
        // Add the tab class and set the path data field
        tabContainer.dataset.path = path;
        tabContainer.classList.add("tab");

        // If it's active, add the active class
        if (tab.active) {
            tabContainer.classList.add("active");
        }

        // Create a <p> element to hold the name of the tab
        const tabTitle = document.createElement("p");

        // Set the innerText to the tab's title, and, if it is unsaved, add (unsaved) as well
        tabTitle.innerText = tab.title + (tab.saved ? "" : " (unsaved)");

        // Add the tab title to the tab container
        tabContainer.appendChild(tabTitle);

        // Create a close button
        const closeBtn = document.createElement("button");

        // Add the material symbols class
        closeBtn.classList.add("material-symbols-outlined");

        // Set the icon to close
        closeBtn.innerText = "close";

        // And add it to the tab container
        tabContainer.appendChild(closeBtn);

        closeBtn.addEventListener("click", (ev) => {
            // On click, dispose of the model
            tab.model.dispose();

            // Delete the tab from the list of tabs
            delete tabs[path];

            // If this was an active tab, activate the last tab if possible
            const tabKeys = Object.keys(tabs);
            if (tab.active && tabKeys.length > 0) tabs[tabKeys[tabKeys.length - 1]].active = true;

            // Render the tabs and prevent the tab container's click event from being triggered
            renderTabs();
            ev.stopPropagation();
        });

        // When the tab is clicked, set it as active
        tabContainer.addEventListener("click", () => {
            // Loop through the tab paths
            Object.keys(tabs).forEach(aTabPath => {
                // Get the tab object
                const aTab = tabs[aTabPath];

                // If it's active, deactivate it
                if (aTab.active) {
                    aTab.active = false;
                }
            });

            // Set this tab as active
            tab.active = true;

            // And re-render the tabs
            renderTabs();
        });

        // Add the tab to the tab container
        tabsContainer.appendChild(tabContainer);

        // If activateActiveTab is set to true, and this tab is active, change the model
        if (activateActiveTab && tab.active) {
            changeModel(tab.model);
        }
    })
}