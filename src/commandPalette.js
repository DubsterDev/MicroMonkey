import Fuse from "fuse.js";

const commandPalette = document.getElementById("commandPalette");
const commandPaletteInput = document.getElementById("commandPaletteInput");
const commandPaletteSuggestions = document.getElementById("commandPaletteSuggestions");

const commands = [
    {
        "id": "alert",
        "name": "Say hi",
        "callback": () => alert("HI!")
    }
];

export function setupCommandPalette() {
    document.addEventListener("keydown", (ev) => {
        if (ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === "p") {
            ev.preventDefault();
            commandPalette.style.display = "block";
            commandPaletteInput.value = "";
            commandPaletteInput.placeholder = "";
            commandPaletteInput.focus();
            displaySuggestions();
            return true;
        }
    });

    commandPaletteInput.addEventListener("keydown", (ev) => {
        if (ev.key.toLowerCase() === "escape") {
            ev.preventDefault();
            commandPalette.style.display = "none";
            return true;
        }

        displaySuggestions(commandPaletteInput.value);
    });
}

export function addCommand(id, name, callback) {
    commands.push({
        "id": id,
        "name": name,
        "callback": callback
    });
}

function displaySuggestions(searchTerm="") {
    commandPaletteSuggestions.innerText = "";

    const fuse = new Fuse(commands, {
        keys: [
            "id",
            "name"
        ]
    });

    console.log(searchTerm);

    const searchResults = searchTerm.trim() !== "" ? fuse.search(searchTerm) : commands;

    searchResults.forEach((item) => {
        const { name, id, callback } = "item" in item ? item.item : item;
        const suggestion = document.createElement("p");
        suggestion.innerText = name;
        suggestion.addEventListener("click", callback);
        commandPaletteSuggestions.appendChild(suggestion);
    });
}