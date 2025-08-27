import Fuse from "fuse.js";

const commandPalette = document.getElementById("commandPalette");
const commandPaletteInput = document.getElementById("commandPaletteInput");
const commandPaletteSuggestions = document.getElementById("commandPaletteSuggestions");

const commands = [
    {
        "id": "alert",
        "name": "Say hi",
        "callback": () => alert("HI!")
    },
    {
        "id": "deleteit",
        "name": "Delete something",
        "callback": async () => {
            const input = await getInput("What would you like to delete?");
            removeCommand(input)
        }
    },
    {
        "id": "addit",
        "name": "Add say hi",
        "callback": () => addCommand("alert2", "Say hi (added)", () => alert("Howdy"))
    }
];

let usingCommands = commands;
let callbackEnter, callbackEscape;

export function setupCommandPalette() {
    document.addEventListener("keydown", (ev) => {
        if (ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === "p") {
            ev.preventDefault();
            showCommandPalette();
            return true;
        }
    });

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
            }
            return true;
        }

        displaySuggestions(commandPaletteInput.value);
    });
}

export function showCommandPalette(placeholder="", defaultValue="", useCommands=commands, optionPicked, escaped) {
    commandPalette.style.display = "block";
    commandPaletteInput.value = defaultValue;
    commandPaletteInput.placeholder = placeholder;
    commandPaletteInput.focus();
    usingCommands = useCommands;
    callbackEnter = optionPicked;
    callbackEscape = escaped;

    displaySuggestions();
}

export function getInput(placeholder, defaultValue) {
    return new Promise((resolve, reject) => {
        showCommandPalette(placeholder, defaultValue, [], resolve, reject);
    })
}

export function addCommand(id, name, callback) {
    const command = {
        "id": id,
        "name": name,
        "callback": callback
    };

    let needsToAddNewCommand = true;
    commands.forEach((_command, index) => {
        if (_command.id === id) {
            needsToAddNewCommand = false;
            commands[index] = command;
        }
    });

    if (needsToAddNewCommand) commands.push(command);

    displaySuggestions();
}

export function removeCommand(id) {
    commands.forEach((command, index) => {
        if (command.id === id) {
            commands.splice(index, 1);
        }
    });
    displaySuggestions();
}

function displaySuggestions(searchTerm="") {
    commandPaletteSuggestions.innerText = "";

    const fuse = new Fuse(usingCommands, {
        keys: [
            "id",
            "name"
        ]
    });

    console.log(searchTerm);

    const searchResults = searchTerm.trim() !== "" ? fuse.search(searchTerm) : usingCommands;

    searchResults.forEach((item) => {
        const { name, id, callback } = "item" in item ? item.item : item;
        const suggestion = document.createElement("p");
        suggestion.innerText = name;
        suggestion.addEventListener("click", callback);
        commandPaletteSuggestions.appendChild(suggestion);
    });
}