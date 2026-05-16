import { writeFile } from "fs/promises";
import { getProjectLicenses } from "generate-license-file";

const coreProjectLicenses = await getProjectLicenses("./core/package.json");
const electronProjectLicenses = await getProjectLicenses("./electron/package.json");

function licensesToText(licenses) {
    let returnOutput = '';

    licenses.forEach(license => {
        returnOutput += `### ${license.dependencies.join(", ")}

**License:**

\`\`\`text
${license.content}
\`\`\`
`;

        if (license.notices.length > 0) {
            returnOutput += `
**Notice${license.notices.length > 1 ? "s" : ""}:**

\`\`\`text
${license.notices.join('\n\n')}
\`\`\`

`
        }
    });

    return returnOutput;
}

let coreOutput = licensesToText(coreProjectLicenses);
let electronOutput = licensesToText(electronProjectLicenses);

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

writeFile("THIRD_PARTY_LICENSES.md", output);
