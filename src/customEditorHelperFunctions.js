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