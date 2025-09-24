/**
 * Create and append a heading to an element
 * @param {string} content The content of the heading
 * @param {string} headingLevel The heading level, such as h1 or h2
 * @param {Element} root The element to append to
 */
export function addHeading(content, headingLevel, root) {
    const element = document.createElement(headingLevel);
    element.innerText = content;
    root.appendChild(element);
}

/**
 * Create and append a paragraph to an element
 * @param {string} content The content of the new paragraph
 * @param {Element} root The element to append to
 */
export function addParagraph(content, root) {
    const element = document.createElement("p");
    element.innerText = content;
    root.appendChild(element);
}

/**
 * Create and append a success, warning, or error message to an element
 * @param {string} level success, warning, or error
 * @param {string} content The content
 * @param {Element} root The element to append to
 */
export function addMessageBox(level, content, root) {
    const element = document.createElement("p");
    element.classList.add("messagebox");
    element.classList.add(level);

    const icon = document.createElement("span");
    icon.classList.add("material-symbols-outlined");
    icon.innerText = level.replaceAll("success", "check_circle");
    element.appendChild(icon);

    const text = document.createElement("span");
    text.innerText = content;
    element.appendChild(text);

    root.appendChild(element);
}

/**
 * Create and append a checkbox to an element
 * @param {string} content The content of the new checkbox's label
 * @param {Element} root The element to append to
 * @param {boolean} checked The checkbox initial state
 * @param {Function|undefined} callback A callback for when the checkbox value changes. Called with one parameter: boolean value of checked state
 */
export function addCheckbox(content, root, checked=false, callback) {
    const label = document.createElement("label");
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    if (callback !== undefined) checkbox.addEventListener("change", () => {
        callback(checkbox.checked);
    });
    label.appendChild(checkbox);

    const span = document.createElement("span");
    span.innerText = content;
    label.appendChild(span);

    root.appendChild(label);
}