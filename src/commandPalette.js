// Used for fuzzy searching
import Fuse from "fuse.js";

// Define element variables
const commandPalette = document.getElementById("commandPalette");
const commandPaletteInput = document.getElementById("commandPaletteInput");
const commandPaletteSuggestions = document.getElementById("commandPaletteSuggestions");
const commandPaletteTitle = document.getElementById("commandPaletteTitle");

// Create a default list of commands
const commands = [];

// Define some variables for using on input requested
let usingCommands = commands;
let callbackEnter, callbackEscape;

// The ID of the currently selected suggestion
let selectedSuggestionId = "noCommandSelected";

/**
 * Adds event listeners to launch the command palette (CTRL+SHIFT+P),
 * and to close the command palette with ESC,
 * and also to handle ESC and Enter when waiting for input.
 * @returns {void}
 */
export function setupCommandPalette() {
    // Add an event listener to launch the command palette with CTRL+SHIFT+P
    document.addEventListener("keydown", (ev) => {
        if (ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === "p") {
            ev.preventDefault();
            showCommandPalette();
            return true;
        }
    });

    // Detect escapes and enters and filter suggestions as the user types
    commandPaletteInput.addEventListener("keydown", (ev) => {
        if (ev.key.toLowerCase() === "escape") {
            ev.preventDefault();
            commandPalette.style.display = "none";
            if (callbackEscape) callbackEscape();
            return true;
        } else if (ev.key.toLowerCase() === "enter") {
            ev.preventDefault();
            if (callbackEnter) {
                commandPalette.style.display = "none";
                callbackEnter(commandPaletteInput.value);
            } else {
                const activeSuggestion = document.querySelector(".commandPalette .suggestions p.active");
                if (activeSuggestion) {
                    const commandId = activeSuggestion.dataset.commandId;
                    usingCommands.forEach((command) => {
                        if (command.id === commandId) {
                            commandPalette.style.display = "none";
                            command.callback();
                        }
                    });
                }
            }
            return true;
        } else if (ev.key.toLowerCase() === "arrowdown") {
            ev.preventDefault();
            const activeSuggestion = document.querySelector(".commandPalette .suggestions p.active");
            if (activeSuggestion && activeSuggestion.nextSibling) {
                selectedSuggestionId = activeSuggestion.nextSibling.dataset.commandId;
            } else {
                selectedSuggestionId = "noCommandSelected";
            }
        } else if (ev.key.toLowerCase() === "arrowup") {
            ev.preventDefault();
            const activeSuggestion = document.querySelector(".commandPalette .suggestions p.active");
            if (activeSuggestion && activeSuggestion.previousSibling) {
                selectedSuggestionId = activeSuggestion.previousSibling.dataset.commandId;
            } else {
                selectedSuggestionId = document.querySelector(".commandPalette .suggestions p:last-child").dataset.commandId;
            }
        }

        displaySuggestions(commandPaletteInput.value);
    });
}

/**
 * Opens the command palette, clears it to the default value provided, and displays the suggestions.
 * @param {string|null} title An optional title for the command palette
 * @param {string} placeholder A placeholder for the command palette input
 * @param {string} defaultValue The default value for the command palette input
 * @param {array} useCommands An array of commands to suggest
 * @param {Function} optionPicked A function, called when enter is hit
 * @param {Function} escaped A function, called when the user escapes from the input
 * @returns {void}
 */
export function showCommandPalette(title=null, placeholder="", defaultValue="", useCommands=commands, optionPicked, escaped) {
    commandPaletteTitle.style.display = title ? "block" : "none";
    commandPaletteTitle.innerText = title ? title : "Command Palette";
    commandPalette.style.display = "block";
    commandPaletteInput.value = defaultValue;
    commandPaletteInput.placeholder = placeholder;
    commandPaletteInput.focus();
    usingCommands = useCommands;
    callbackEnter = optionPicked;
    callbackEscape = escaped;
    selectedSuggestionId = "noCommandSelected";

    displaySuggestions();
}

/**
 * Launches the command palette and resolves with the input in the input,
 * or undefined if the user pressed the escape key.
 * @param {string|null} title An optional title for the command palette
 * @param {string} placeholder A placeholder for the command palette input
 * @param {string} defaultValue The default value for the command palette input
 * @param {array} options An array of options to suggest
 * @param {boolean} allowArbitraryInput Whether to allow arbitrary input, or only allow selecting from the options
 * @returns {Promise<string|undefined>} The user inputted string, or undefined if ESCAPE was pressed.
 */
export function getInput(title=null, placeholder, defaultValue, options=[], allowArbitraryInput=true) {
    return new Promise((resolve) => {
        options.forEach((option, index) => {
            if (typeof option === "object" && "name" in option) {
                if (!("id" in option)) option.id = `option${index}`;
                if (!("callback" in option)) option.callback = () => { resolve(option.name) };
            } else {
                options[index] = {
                    "name": option,
                    "id": `option${index}`,
                    "callback": () => { resolve(option) }
                };
            } 
        });
        showCommandPalette(title, placeholder, defaultValue, options, allowArbitraryInput ? resolve : null, resolve);
    })
}

/**
 * Adds a command to the command palette.
 * @param {string} id A unique id for this command, if the command is already in the list of commands, it is replaced.
 * @param {string} name The user-visible name for the command.
 * @param {Function} callback A callback that is called when the command is clicked.
 * @returns {void}
 */
export function addCommand(id, name, callback) {
    // Constructs an object containing the command details
    const command = {
        "id": id,
        "name": name,
        "callback": callback
    };

    // Loop through all the commands
    let needsToAddNewCommand = true;
    commands.forEach((_command, index) => {
        // Check if the id is the same
        if (_command.id === id) {
            // If it is, say we don't need to add a new command, and replace this command
            needsToAddNewCommand = false;
            commands[index] = command;
        }
    });

    // If a match was not found, add it to the end of the commands
    if (needsToAddNewCommand) commands.push(command);

    // Update the displayed suggestions
    displaySuggestions();
}

/**
 * Removes a command from the command palette by id
 * @param {string} id The id of the command to remove
 * @returns {void}
 */
export function removeCommand(id) {
    // Loop through the commands
    commands.forEach((command, index) => {
        // If the id matches, splice it out of the array
        if (command.id === id) {
            commands.splice(index, 1);
        }
    });

    // Update the displayed commands
    displaySuggestions();
}

/**
 * Clears the command palette suggestions box, and add the commands to the DOM.
 * @param {string} searchTerm A string to fuzzy search by
 */
function displaySuggestions(searchTerm="") {
    // Clear the suggestions box
    commandPaletteSuggestions.innerText = "";

    // Create an instance of Fuse
    const fuse = new Fuse(usingCommands, {
        keys: [
            "id",
            "name"
        ]
    });

    // If there is a search term, fuzzy search it, else do all commands
    const searchResults = searchTerm.trim() !== "" ? fuse.search(searchTerm) : usingCommands;

    // Loop through the search results
    searchResults.forEach((item, index) => {
        // Destructure the result
        const { name, id, callback } = "item" in item ? item.item : item;

        // Create an element for the suggestion
        const suggestion = document.createElement("p");

        // Add the active class to the first suggestion or the one that matches the selected suggestion id
        if ((index === 0 && selectedSuggestionId === "noCommandSelected") || id === selectedSuggestionId) {
            suggestion.classList.add("active");
            selectedSuggestionId = id;
        }

        // Add the command id as a data attribute
        suggestion.dataset.commandId = id;

        // Set it's name
        suggestion.innerText = name;

        // Add a callback
        suggestion.addEventListener("click", () => {
            commandPalette.style.display = "none";
            callback();
        });

        // Add it to the suggestions box
        commandPaletteSuggestions.appendChild(suggestion);
    });
}