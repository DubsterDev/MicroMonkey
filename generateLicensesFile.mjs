import { writeFile } from "fs/promises";
import { getProjectLicenses } from "generate-license-file";

const coreProjectLicenses = await getProjectLicenses("./core/package.json");
const electronProjectLicenses = await getProjectLicenses("./electron/package.json");

function licensesToText(licenses) {
    let returnOutput = '';
    let returnOutputHtml = '';

    licenses.forEach(license => {
        returnOutput += `### ${license.dependencies.join(", ")}

**License:**

\`\`\`text
${license.content}
\`\`\`
`;

        returnOutputHtml += `<h3>${license.dependencies.join(", ")}</h3>

<p><b>License:</b></p>

<pre><code>
${license.content}
</pre></code>
`;

        if (license.notices.length > 0) {
            returnOutput += `
**Notice${license.notices.length > 1 ? "s" : ""}:**

\`\`\`text
${license.notices.join('\n\n')}
\`\`\`

`
            returnOutputHtml += `
<p><b>Notice${license.notices.length > 1 ? "s" : ""}:</b></p>

<pre><code>
${license.notices.join('\n\n')}
</code></pre>

`
        }
    });

    return [returnOutput, returnOutputHtml];
}

let [coreOutput, coreOutputHtml] = licensesToText(coreProjectLicenses);
let [electronOutput, electronOutputHtml] = licensesToText(electronProjectLicenses);

const output = `# Licenses

All the third party software used in MicroMonkey is listed here with it's license.

## Core

These dependencies are used everywhere.

${coreOutput}

## Electron

These dependencies are only used in the Electron desktop app.

${electronOutput}

## Acknowledgements

This file was generated with [Generate License File](https://github.com/TobyAndToby/generate-license-file)`;

const outputHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Third-Party Licenses | MicroMonkey</title>
    <style>
        * {
            box-sizing: border-box;
        }
        
        *:not(pre, pre *) {
            font-family: sans-serif;
        }

        pre {
            width: 100%;
            overflow: auto;
            background-color: #eeeeee;
            scrollbar-width: thin;
            padding: 12px;
            border-radius: 12px;
        }
    </style>
</head>
<body>
    <h1>Licenses</h1>
    <p>All the third party software used in MicroMonkey is listed here with it's license.</p>
    <h2>Core</h2>
    <p>These dependencies are used everywhere.</p>
    ${coreOutputHtml}
    <h2>Electron</h2>
    <p>These dependencies are only used in the Electron desktop app.</p>
    ${electronOutputHtml}
    <h2>Acknowledgements</h2>
    <p>This file was generated with <a href="https://github.com/TobyAndToby/generate-license-file" target="_blank">Generate License File</a>
</body>
</html>`

writeFile("THIRD_PARTY_LICENSES.md", output);
writeFile("electron/third_party_licenses.html", outputHtml);