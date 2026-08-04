const fs = require("fs");

const rules = JSON.parse(fs.readFileSync("rules.json", "utf-8"));

let output = "";

for (const rule of rules) {
  if (rule.mode === "proxy") {
    output += `
${rule.source} {
  reverse_proxy ${rule.target} {
    header_up Host {upstream_hostport}
  }
}
`;
  } else if (rule.mode === "redirect") {
    output += `
${rule.source} {
  redir ${rule.target}{uri} 302
}
`;
  } else if (rule.mode === "permRedirect") {
    output += `
${rule.source} {
  redir ${rule.target}{uri} 301
}
`;
  }
}

fs.writeFileSync("Caddyfile", output.trim());
console.log("Caddyfile generated.");