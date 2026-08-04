import { Octokit } from "octokit";

export default async function handler(req, res) {
  const { source, target, mode, requestedBy } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const owner = "evanxdsouza";
  const repo = "proxyparty-golfer";

  const { data: file } = await octokit.rest.repos.getContent({
    owner, repo, path: "rules.json",
  });
  const rules = JSON.parse(Buffer.from(file.content, "base64").toString());
  rules.push({ source, target, mode, addedBy: requestedBy });

  const branch = `add-${source}-${Date.now()}`;
  const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: "heads/main" });
  await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: ref.object.sha });

  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo, path: "rules.json", branch,
    message: `Add rule: ${source} -> ${target}`,
    content: Buffer.from(JSON.stringify(rules, null, 2)).toString("base64"),
    sha: file.sha,
  });

  const { data: pr } = await octokit.rest.pulls.create({
    owner, repo, title: `Add proxy rule: ${source}`,
    head: branch, base: "main",
    body: `Requested by @${requestedBy} via dashboard.`,
  });

  res.status(200).json({ prUrl: pr.html_url });
}