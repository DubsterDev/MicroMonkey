import { addCommand } from "./commandPalette";
import { addCheckbox, addHeading, addInput } from "./customEditorHelperFunctions";
import { openTab } from "./openFilesManager";

// A list of default settings, used if no value is set
const defaults = {
    "syntax-checking": true,
    "reboot-on-save": true,
    "git-cors-proxy": ''
};

/**
 * Adds a event listener and a command to the command palette for opening settings.
 */
export function setupSettings() {
    document.getElementById("openSettings").addEventListener("click", openSettings);
    addCommand("openSettings", "Settings", openSettings);
}

/**
 * Launches the settings tab.
 */
export function openSettings() {
    openTab("/.default_files/micromonkey/settings.mm", "Settings", "custom", renderSettings);
}

/**
 * Set a setting
 * @param {string} key The key for the setting
 * @param {string} value The new value for the setting
 */
export function setSetting(key, value) {
    // Parse the settings object
    const settings = JSON.parse(localStorage.getItem("micromonkey-settings") || "{}");

    // Store the setting
    settings[key] = value;

    // Save the settings
    localStorage.setItem("micromonkey-settings", JSON.stringify(settings));
}

/**
 * Retrieve a setting
 * @param {string} key The key to retrieve
 * @param {*} defaultValue The value to return if the setting wasn't defined and there is no default set already
 * @returns {*} The value of the setting
 */
export function getSetting(key, defaultValue) {
    // Parse the settings object
    const settings = JSON.parse(localStorage.getItem("micromonkey-settings") || "{}");

    // Return the value
    return settings[key] ?? (defaults[key] ?? defaultValue);
}

/**
 * Renders the settings page
 * @param {Element} root The root to render on
 */
function renderSettings(root) {
    addHeading("Settings", "h2", root);

    addHeading("Auto-reboot device", "h3", root);
    addCheckbox("Reboots the device when the file is saved", root, getSetting("reboot-on-save"), (bool) => setSetting("reboot-on-save", bool));

    addHeading("Syntax Checking", "h3", root);
    addCheckbox("Show syntax errors such as missing colons and undefined variables.", root, getSetting("syntax-checking"), (bool) => setSetting("syntax-checking", bool));

    addHeading("Git CORS Proxy", "h3", root);
    addInput(
        "CORS proxy URL: ",
        root, 
        getSetting("git-cors-proxy"), 
        (value) => setSetting("git-cors-proxy", value)
    );
    
}