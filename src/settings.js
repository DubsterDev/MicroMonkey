import { addCommand } from "./commandPalette";
import { addCheckbox, addHeading } from "./customEditorHelperFunctions";
import { openTab } from "./openFilesManager";

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
 * @param {*} defaultValue The value to return if the setting wasn't defined
 * @returns {*} The value of the setting
 */
export function getSetting(key, defaultValue) {
    // Parse the settings object
    const settings = JSON.parse(localStorage.getItem("micromonkey-settings") || "{}");

    // Return the value
    return settings[key] ?? defaultValue;
}

/**
 * Renders the settings page
 * @param {Element} root The root to render on
 */
function renderSettings(root) {
    addHeading("Settings", "h2", root);

    addHeading("Auto-reboot device", "h3", root);
    addCheckbox("Reboots the device when the file is saved", root, getSetting("reboot-on-save", true), (bool) => setSetting("reboot-on-save", bool));

    addHeading("Syntax Checking [BETA]", "h3", root);
    addCheckbox("Show syntax errors and other things like missing imports. Off by default while in beta.", root, getSetting("syntax-checking", false), (bool) => setSetting("syntax-checking", bool));
}