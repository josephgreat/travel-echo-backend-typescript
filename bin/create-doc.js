const fs = require("fs");
const path = require("path");

/**
 * @typedef {object} Entry
 * @property {string} [method=GET] - The HTTP method
 * @property {string} route - The route
 * @property {string} [description] - The description
 * @property {string} [domain] - The domain
 * @property {boolean} protected - Whether the route is protected
 * @property {{ [key: string]: string }} headers - The headers
 * @property {Array<Params>} params - The parameters
 * @property {{ [key: string]: { type: string, value: any } }} [body] - The body
 * @property {string} [bodyDesc] - An added description that explains the body
 * @property {{ [key: string]: { type: string, value: any } }} response - The response
 * @property {string} [resDesc] - An added description that explains the response
 */

/**
 * @typedef {object} Params
 * @property {string} name - The name of the parameter
 * @property {string} description - The description of the parameter
 * @property {boolean} required - Whether the parameter is required
 * @property {string} type - The type of the parameter
 */

const dirToScan = path.resolve("src");

console.log("🔃 Generating API documentation");

const files = scanDirectory(dirToScan);

const defBlocks = [];
const apiBlocks = [];
const components = new Map();

const grouped = {};

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const { defBlocks: defs, apiBlocks: apis } = extractApiDocumentationBlocks(content);
  defBlocks.push(...defs);
  apiBlocks.push(...apis);
});

defBlocks.forEach((block) => {
  const { key, value } = parseDefinitionBlocks(block);
  components.set(key, value);
});

apiBlocks.forEach((block) => {
  const entry = parseBlock(block, components);
  const domain = entry.domain || "Others";
  grouped[domain] = grouped[domain] || [];
  grouped[domain].push(entry);
});

const methodPriority = {
  GET: 1,
  POST: 2,
  PUT: 3,
  PATCH: 4,
  DELETE: 5
};

const sortedGroup = Object.fromEntries(
  Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([domain, blocks]) => [
      domain,
      blocks.sort((a, b) => {
        if (a.route === b.route) {
          return (
            (methodPriority[a.method.toUpperCase()] ?? 99) -
            (methodPriority[b.method.toUpperCase()] ?? 99)
          );
        }
        return a.route.localeCompare(b.route);
      })
    ])
);

const outputPath = path.resolve("public/api.html");
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath));
}
let html = generateHTML(sortedGroup);
fs.writeFileSync(outputPath, html);

console.log(`✅ API docs generated as HTML at ${outputPath}`);

/**
 * Scans a directory for all .js and .ts files
 * @param {string} dir - The directory to scan
 * @returns {string[]} An array of file paths
 */
function scanDirectory(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(scanDirectory(filePath));
    } else if (filePath.endsWith(".js") || filePath.endsWith(".ts")) {
      results.push(filePath);
    }
  });
  return results;
}

/**
 * Extracts API documentation blocks from a file content
 * @param {string} content - The content of the file to extract blocks from
 * @returns {{ defBlocks: string[], apiBlocks: string[] }} An object containing the extracted blocks
 */
function extractApiDocumentationBlocks(content) {
  const regex = /\/\*\*([\s\S]*?)\*\//g;

  let defBlocks = [];
  let apiBlocks = [];

  let match;

  while ((match = regex.exec(content))) {
    const block = match[1].trim();
    if (block.includes("@def")) {
      defBlocks.push(block);
    }
    if (block.includes("@api")) {
      apiBlocks.push(block);
    }
  }

  return { defBlocks, apiBlocks };
}

/**
 *
 * @param {string} block
 * @returns {{key: string, value: string}}
 */
function parseDefinitionBlocks(block) {
  const lines = block
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^\*\s?/, "")
        .trim()
    )
    .filter((line) => line.trim() !== "");

  const parsedLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("@")) {
      parsedLines.push(line);
    } else {
      if (parsedLines.length > 0) {
        parsedLines[parsedLines.length - 1] += " " + line;
      }
    }
  }

  const matched = parsedLines[0].match(/^@\w+(?:\s*\{(.+?)\})?\s*(.*)$/);

  return {
    key: matched[1],
    value: parsedLines.slice(1).join("\n")
  };
}

/**
 * Parses an API documentation block
 * @param {string} block - The API documentation block to parse
 * @param {Map<string, string>} components - The components to replace
 * @returns {Entry} The parsed API documentation block
 */
function parseBlock(block, components) {
  const lines = escapeHtml(block)
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^\*\s?/, "")
        .trim()
    )
    .filter((line) => line.trim() !== "");

  /**
   * @type {string[]}
   */
  const parsedLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("@")) {
      parsedLines.push(line);
    } else {
      if (parsedLines.length > 0) {
        parsedLines[parsedLines.length - 1] += " " + line;
      }
    }
  }

  /**
   * @type {Entry}
   */
  const entry = {
    headers: {},
    params: [],
    body: {},
    response: {}
  };

  const uses = parsedLines.filter((line) => line.startsWith("@use"));

  uses.forEach((line) => {
    const matched = line.match(/^@\w+(?:\s*\{(.+?)\})?\s*(.*)$/);
    const str1 = (matched[1] || "").trim();
    const block = escapeHtml(components.get(str1));
    if (block) {
      parsedLines.push(...block.split("\n"));
    }
  });

  for (const line of parsedLines) {
    const [, a, b] = line.match(/^@\w+(?:\s*\{(.+?)\})?\s*(.*)$/);

    /**
     * @type {string}
     */
    const str1 = (a || "").trim();
    /**
     * @type {string}
     */
    const str2 = (b || "").trim();

    if (line.startsWith("@api")) {
      entry.method = str1.toUpperCase() || "GET";
      entry.route = str2;

      entry.params = entry.route
        .split("/")
        .filter((part) => part !== "" && part.trim().startsWith(":"))
        .map((part) => {
          const isOptional = part.endsWith("?");
          return {
            name: isOptional ? part.trim().slice(1, -1) : part.trim().slice(1),
            description: "",
            required: !isOptional,
            type: "path"
          };
        });
      continue;
    }

    if (line.startsWith("@desc")) {
      entry.description = str1 || str2;
      continue;
    }

    if (line.startsWith("@domain")) {
      entry.domain = str1 || str2;
      continue;
    }

    if (line.startsWith("@auth")) {
      entry.protected = true;
      continue;
    }

    if (line.startsWith("@header")) {
      entry.headers[str1] = str2;
      continue;
    }

    if (line.startsWith("@par")) {
      const isOptional = str1.endsWith("?");
      const name = isOptional ? str1.slice(0, -1) : str1;
      const rest = str2;
      let paramType = "";
      let paramDesc = "";

      if (rest.includes("@path") || rest.includes("@query")) {
        const [type, ...desc] = rest.split(" ");
        paramType = type.slice(1).trim();
        paramDesc = desc.join(" ").trim();
      } else {
        paramType = "path";
        paramDesc = rest;
      }

      const existingParam = entry.params.find((p) => p.name === name);

      if (existingParam) {
        if (!existingParam.description && paramDesc) {
          existingParam.description = paramDesc;
        }
        if (existingParam.required === undefined) {
          existingParam.required = !isOptional;
        }
      } else {
        entry.params.push({
          name,
          type: paramType,
          description: paramDesc,
          required: !isOptional
        });
      }
      continue;
    }

    if (line.startsWith("@bodyDesc")) {
      entry.bodyDesc = str1 || str2;
      continue;
    }

    if (line.startsWith("@body")) {
      entry.body.type = str2 ? str1 : "unknown";

      let body = str2 || str1 || undefined;

      if (body) {
        if ((body.startsWith("{") && body.endsWith("}")) || entry.body.type === "json") {
          body = prettyPrintPseudoJSON(body);
        }
        entry.body.value = body;
      }
      continue;
    }

    if (line.startsWith("@resDesc")) {
      entry.resDesc = str1 || str2;
      continue;
    }

    if (line.startsWith("@res") || line.startsWith("@response")) {
      entry.response.type = str2 ? str1 : "unknown";

      let response = str2 || str1 || undefined;

      if (response) {
        if (
          (response.startsWith("{") && response.endsWith("}")) ||
          entry.response.type === "json"
        ) {
          response = prettyPrintPseudoJSON(response);
        }
        entry.response.value = response;
      }
      continue;
    }
  }

  if (entry.route) {
    entry.route = entry.route.replace(/:([\w]+)\??/g, (_, param) =>
      entry.route.includes(`:${param}?`) ? `{${param}?}` : `{${param}}`
    );
  }

  if (!entry.protected && entry.headers["Authorization"]) {
    entry.protected = true;
  }

  entry.params.forEach(
    (param) => (param.description = param.description ? param.description : param.name)
  );

  return entry;
}

/**
 * @param {string} row the JSON string to be formatted
 * @returns {string} the formatted JSON string
 */
function prettyPrintPseudoJSON(raw) {
  // Replace ... with null temporarily
  const placeholder = "___PLACEHOLDER___";
  //const replaced = raw.replace(/\.{3}/g, `"p": "${placeholder}"`);
  const replaced = raw.replace(/(\{\s*)\.{3}(\s*\})/g, `$1"p": "${placeholder}"$2`);

  try {
    // Parse and pretty-print
    const parsed = JSON.parse(replaced);
    let pretty = JSON.stringify(parsed, null, 2);

    // Replace placeholder back with ...
    pretty = pretty.replace(new RegExp(`"p": "${placeholder}"`, "g"), "...");

    return pretty;

    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    //console.log(replaced)
    //console.log(err)
    // Fallback: return raw if formatting fails
    return raw;
  }
}

/**
 * @param {string} str the string to be escaped
 * @returns {string} the escaped string
 */
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;") // must go first
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\_\_([^_]+)\_\_/g, "<i>$1</i>")
    .replace(/```([^`]+)```/g, "<code>$1</code>")
    .replace(/\\n/g, "<br />");
  //.replace(/"/g, '&quot;')
  //.replace(/'/g, '&#039;');
}

/**
 * @param {Object} grouped the grouped API data
 * @returns {string} the HTML string
 */
function generateHTML(grouped) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="The official API documentation for Travel Echo">
  <title>Travel Echo API Documentation</title>
  <link rel="icon" type="image/ico" href="/favicon.ico">
  <style>
    :root {
      --red-50: oklch(0.971 0.013 17.38);
      --red-100: oklch(0.936 0.032 17.717);
      --red-200: oklch(0.885 0.062 18.334);
      --red-300: oklch(0.808 0.114 19.571);
      --red-400: oklch(0.704 0.191 22.216);
      --red-500: oklch(0.637 0.237 25.331);
      --red-600: oklch(0.577 0.245 27.325);
      --red-700: oklch(0.505 0.213 27.518);
      --red-800: oklch(0.444 0.177 26.899);
      --red-900: oklch(0.396 0.141 25.723);
      --red-950: oklch(0.258 0.092 26.042);
      
      --amber-50: oklch(0.987 0.022 95.277);
      --amber-100: oklch(0.962 0.059 95.617);
      --amber-200: oklch(0.924 0.12 95.746);
      --amber-300: oklch(0.879 0.169 91.605);
      --amber-400: oklch(0.828 0.189 84.429);
      --amber-500: oklch(0.769 0.188 70.08);
      --amber-600: oklch(0.666 0.179 58.318);
      --amber-700: oklch(0.555 0.163 48.998);
      --amber-800: oklch(0.473 0.137 46.201);
      --amber-900: oklch(0.414 0.112 45.904);
      --amber-950: oklch(0.279 0.077 45.635);

      --lime-50: oklch(0.986 0.031 120.757);
      --lime-100: oklch(0.967 0.067 122.328);
      --lime-200: oklch(0.938 0.127 124.321);
      --lime-300: oklch(0.897 0.196 126.665);
      --lime-400: oklch(0.841 0.238 128.85);
      --lime-500: oklch(0.768 0.233 130.85);
      --lime-600: oklch(0.648 0.2 131.684);
      --lime-700: oklch(0.532 0.157 131.589);
      --lime-800: oklch(0.453 0.124 130.933);
      --lime-900: oklch(0.405 0.101 131.063);
      --lime-950: oklch(0.274 0.072 132.109);
      
      --green-50: oklch(0.982 0.018 155.826);
      --green-100: oklch(0.962 0.044 156.743);
      --green-200: oklch(0.925 0.084 155.995);
      --green-300: oklch(0.871 0.15 154.449);
      --green-400: oklch(0.792 0.209 151.711);
      --green-500: oklch(0.723 0.219 149.579);
      --green-600: oklch(0.627 0.194 149.214);
      --green-700: oklch(0.527 0.154 150.069);
      --green-800: oklch(0.448 0.119 151.328);
      --green-900: oklch(0.393 0.095 152.535);
      --green-950: oklch(0.266 0.065 152.934);
      
      --blue-50: oklch(0.97 0.014 254.604);
      --blue-100: oklch(0.932 0.032 255.585);
      --blue-200: oklch(0.882 0.059 254.128);
      --blue-300: oklch(0.809 0.105 251.813);
      --blue-400: oklch(0.707 0.165 254.624);
      --blue-500: oklch(0.623 0.214 259.815);
      --blue-600: oklch(0.546 0.245 262.881);
      --blue-700: oklch(0.488 0.243 264.376);
      --blue-800: oklch(0.424 0.199 265.638);
      --blue-900: oklch(0.379 0.146 265.522);
      --blue-950: oklch(0.282 0.091 267.935);
      
      --slate-50: oklch(0.984 0.003 247.858);
      --slate-100: oklch(0.968 0.007 247.896);
      --slate-200: oklch(0.929 0.013 255.508);
      --slate-300: oklch(0.869 0.022 252.894);
      --slate-400: oklch(0.704 0.04 256.788);
      --slate-500: oklch(0.554 0.046 257.417);
      --slate-600: oklch(0.446 0.043 257.281);
      --slate-700: oklch(0.372 0.044 257.287);
      --slate-800: oklch(0.279 0.041 260.031);
      --slate-900: oklch(0.208 0.042 265.755);
      --slate-950: oklch(0.129 0.042 264.695);

      --black: #000;
      --white: #fff;

      --breakpoint-sm: 640px;
      --breakpoint-md: 768px;
      --breakpoint-lg: 1024px;
      --breakpoint-xl: 1280px;
      --breakpoint-2xl: 1536px;
    }

    @font-face {
      font-family: 'Inter';
      src: url('assets/fonts/Inter.ttf') format('truetype');
      //font-weight: normal;
      font-style: normal;
      font-display: swap;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Inter 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: var(--slate-700);
      background-color: var(--slate-50);
    }

    main {
      padding: 1rem 1rem 5rem 1rem;
    }
    
    .code-block {
      background-color: var(--slate-800);
      color: var(--slate-50);
      border-radius: 4px;
      padding: 0.5rem 1rem;
      overflow-x: auto;
      font-family: monospace;

      code {
        display: block;
        margin-top: 5px;
        margin-bottom: 5px;

        &::first-child {
          margin-top: 0;
        }

        &::last-child {
          margin-bottom: 0;
        }
      }
    }
    .header {
      padding: 1rem;
      h1 {
        font-weight: 600;
      }
      .version {
        font-size: 0.75rem;
        background-color: var(--slate-500);
        border-radius: 2px;
        padding: 2px 6px;
        color: white;
        font-weight: 600;
        width: fit-content
      }
      .description {
        color: var(--slate-500);
      }
    }
    .domain {
      padding: 1rem;
      border: 1px solid var(--slate-200);
      border-radius: 8px;
      background-color: var(--white);
      transition: all 200ms ease-out;
    }
    .api {
      transition: all 200ms ease-out;
      
      .api-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.65rem;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;

        @media screen and (max-width: 640px) {
          flex-direction: column;
          gap: 0.4rem;
          text-align: center;
        }

        .method {
          border-radius: 3px;
          padding: 4px 6px;
          min-width: 4rem;
          font-weight: 600;
          text-align: center;
        }

        &.get {
          background-color: var(--blue-50);
          border: 1px solid var(--blue-300);
          .method {
            background-color: var(--blue-500);
            color: var(--white);
          }
        }
        &.post {
          background-color: var(--green-50);
          border: 1px solid var(--green-300);
          .method {
            background-color: var(--green-500);
            color: var(--white);
          }
        }
        &.put {
          background-color: var(--amber-50);
          border: 1px solid var(--amber-300);
          .method {
            background-color: var(--amber-500);
            color: var(--white);
          }
        }
          &.patch {
          background-color: var(--lime-50);
          border: 1px solid var(--lime-300);
          .method {
            background-color: var(--lime-500);
            color: var(--white);
          }
        }
        &.delete {
          background-color: var(--red-50);
          border: 1px solid var(--red-300);
          .method {
            background-color: var(--red-500);
            color: var(--white);
          }
        }
        .icons {
          margin-left: auto;
          display: flex;
          gap: 0.25rem;

          @media screen and (max-width: 640px) {
            margin-left: 0;
          }

          .chevron {
            transition: transform 0.2s ease-in-out;
            &.active {
              transform: rotate(180deg);
            }
            @media screen and (max-width: 640px) {
              display: none;
            }
          }
        }
      }

      .content {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 0.3s ease-out;

        &.active {
          grid-template-rows: 1fr;
        }

        .content-wrapper {
          overflow: hidden
        }
      }
    }
    .simple-table {
      min-width: 24rem;
      width: 100%;
      border-collapse: collapse;
      font-family: monospace;
    }
  
    .simple-table th, 
    .simple-table td {
      border: 1px solid var(--slate-300);
      padding: 8px;
      text-align: left;
    } 
  
    .simple-table th {
      background-color: var(--slate-200);
      font-weight: bold;
    }
  
    .simple-table tr:nth-child(even) {
      background-color: var(--slate-50);
    }
    
    .body-desc, .res-desc {
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius:4px;
      background-color: var(--slate-100);
      color: var(--slate-600);
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>Travel Echo</h1>
    <p class="version">v1.0.0</p>
    <br />
    <p class="description">API documentation for the Travel Echo application</p>
    <hr style="margin: 0.875rem 0; border: 1px solid var(--slate-200)" />
    <div style="font-family: monospace; font-size: 1rem;">
      <p>Base url: </p>
      <p><b>https://travel-echo-backend.onrender.com/api/v1</b></p>
    </div>
  </header>

  <main style="display: flex; flex-direction: column; gap: 2rem;">
    ${Object.entries(grouped)
      .map(
        ([key, apiArray]) =>
          `<section class="domain">
        <h2>${key}</h2>

        <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem">
          ${apiArray
            .map(
              (api, index) => `<div class="api">
            <header class="api-header ${api.method?.toLowerCase()}">
              <p class="method">${api.method}</p>
              <p style="font-family: monospace; font-weight: 600; font-size: 0.9rem;">${api.route}</p>
              ${api.description ? `<p style="font-size: 0.9rem; color: var(--slate-600)">${api.description}</p>` : ""}

              <div class="icons">
              ${
                api.protected
                  ? `<div class="protected" style="color: var(--slate-400)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 -960 960 960" fill="currentColor"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z"/></svg>
                </div>`
                  : `<div class="unprotected" style="color: var(--slate-400)">
                  <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor"><path d="M240-640h360v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85h-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640Zm240 360q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280Z"/></svg>
                </div>`
              }

                <div class="chevron" style="color: var(--slate-700)">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                </div>
              </div>
            </header>

            <div class="content">
              <div class="content-wrapper" style="padding-top: 1.2rem;">
                <header class="content-header" style="display: flex; align-items: center; gap: 0.8rem;">
                  <div>
                    <input type="radio" name="content-${key}-${index}" id="params-${key}-${index}" value="params" checked="true" />
                    <label for="params-${key}-${index}" style="font-size: 0.785rem; font-weight: 600">Params</label>
                  </div>
                  
                  <div>
                    <input type="radio" name="content-${key}-${index}" id="headers-${key}-${index}" value="headers" />
                    <label for="headers-${key}-${index}" style="font-size: 0.785rem; font-weight: 600">Headers</label>
                  </div>
    
                  <div>
                    <input type="radio" name="content-${key}-${index}" id="body-${key}-${index}" value="body" />
                    <label for="body-${key}-${index}" style="font-size: 0.785rem; font-weight: 600">Body</label>
                  </div>
    
                  <div>
                    <input type="radio" name="content-${key}-${index}" id="response-${key}-${index}" value="response" />
                    <label for="response-${key}-${index}" style="font-size: 0.785rem; font-weight: 600">Response</label>
                  </div>
                </header>
    
                <div class="content-section" style="margin-top: 0.75rem; font-size: 0.88rem; font-weight: 500;">
                  ${
                    api.params.length > 0
                      ? `<section data-content="params" class="params-content">
                    <div style="overflow-x: auto; font-family: monospace; border-radius: 5px;">
                      <table class="simple-table">
                        <thead>
                          <tr style="text-align: left;">
                            <th>Name</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                          </tr>
                        </thead>

                        <tbody>
                          ${api.params
                            .map(
                              ({ name, required, description, type }) => `
                          <tr>
                            <td>
                              <b>${name}</b>
                            </td>
                            <td style="color: ${type === "path" ? "var(--blue-600)" : "var(--slate-500)"}">${type}</td>
                            <td style="font-style: italic;">${required ? "true" : "false"}</td>
                            <td>${description}</td>
                          </tr>
                          `
                            )
                            .join("")}
                        </tbody>
                      </table>
                    </div>
                  </section>`
                      : ""
                  }

                  ${
                    Object.keys(api.headers).length > 0
                      ? `<section data-content="headers" class="headers-content">
                    <div class="code-block">
                    ${Object.entries(api.headers)
                      .map(
                        ([key, value]) => `<code>
                        <span>${key}:</span>
                        <span style="font-weight: 600;">${value}</span>
                      </code>
                      `
                      )
                      .join("")}
                    </div>
                  </section>`
                      : ""
                  }

                  ${
                    api.body?.value || api.bodyDesc
                      ? `<section data-content="body" class="body-content">
                        ${api.bodyDesc ? `<div class="body-desc">${api.bodyDesc}</div>` : ""}
                        ${
                          api.body?.value
                            ? `<div class="code-block">
                          <div>
                            <code style="color: var(--slate-300); font-size: 0.8rem; font-weight: 600">${api.body.type}</code>
                            <hr style="margin: 0.5rem 0; border: 0.8px solid var(--white); opacity: 0.2" />
                          </div>
                          <code>
                            <pre>${api.body.value}</pre>
                          </code>
                        </div>`
                            : ""
                        }
                      </section>`
                      : ""
                  }

                  ${
                    api.response?.value || api.resDesc
                      ? `<section data-content="response" class="response-content">
                        ${api.resDesc ? `<div class="res-desc">${api.resDesc}</div>` : ""}
                        ${
                          api.response?.value
                            ? `<div class="code-block">
                        <div>
                          <code style="color: var(--slate-300); font-size: 0.8rem; font-weight: 600">${api.response.type}</code>
                          <hr style="margin: 0.5rem 0; border: 0.8px solid var(--white); opacity: 0.2" />
                        </div>
                        <code>
                          <pre>${api.response.value}</pre>
                        </code>
                      </div>`
                            : ""
                        }
                    </section>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>`
            )
            .join(" ")}
        </div>
      </section>`
      )
      .join(" ")}
  </main>

  <script>
    const blocks = document.querySelectorAll('.api')
    blocks.forEach((block) => {

      const sections = block.querySelectorAll('section')

      block.querySelector('.api-header')?.addEventListener('click', () => {
        block.querySelector('.content')?.classList.toggle('active')
        block.querySelector('.chevron')?.classList.toggle('active')
      })

      const radio = block.querySelectorAll('input[type="radio"]')
      
      radio.forEach((input) => {
        if (input.checked) {
          sections.forEach((section) => {
            section.style.display = 'none'
            if (section.getAttribute('data-content') === input.value) {
              section.style.display = 'block'
            }
          })
        }
        input.addEventListener('change', () => {
          sections.forEach((section) => {
            section.style.display = 'none'
            if (section.getAttribute('data-content') === input.value) {
              section.style.display = 'block'
            }
          })
        })
      })
    })
  </script>
</body>
</html>`;
}
