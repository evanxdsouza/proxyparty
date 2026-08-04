# Golfer (My version of Hack Club ProxyParty)

## How it works
 
1. `rules.json` is the single source of truth, every domain mapping lives here.
2. `generate-caddyfile.js` makes `rules.json` into a Caddyfile Caddy can run.
3. The dashboard (`pages/api/propose-rule.js`) lets someone submit a new rule, which opens a PR against `rules.json` rather than deploying anything directly.
4. Merging that PR to `main` triggers a GitHub Action that regenerates the Caddyfile and redeploys.

### Prerequisites
 
 - A GitHub fine-grained personal access token, scoped to this repo only, with **Contents: Read and write** and **Pull requests: Read and write**

### Setup
 
```bash
git clone https://github.com/evanxdsouza/proxyparty-golfer.git
cd proxyparty-golfer
npm install
```
 
### Environment variables
 
Create `.env.local` in the project root:
 
```
GITHUB_TOKEN=github_pat_your_actual_token_here
```
```bash
npm run dev
```

Since there's no form UI yet, test via `curl`:
 
```bash
curl -X POST http://localhost:3000/api/propose-rule \
  -H "Content-Type: application/json" \
  -d '{"source":"test.example.com","target":"https://example.com","mode":"proxy","requestedBy":"your-github-username"}'
```
 
**Expected response:**
 
```json
{"prUrl":"https://github.com/evanxdsouza/proxyparty/pull/N"}
```

### Testing Caddyfile generation
 
```bash
node generate-caddyfile.js
cat Caddyfile
```
 
Confirm each rule in `rules.json` produced the block you'd expect — a `proxy` mode rule should produce a `reverse_proxy` block, `redirect`/`permRedirect` should produce `redir` with the correct status code.

## Testing the proxy itself, end-to-end, locally
 
```bash
docker run -d --name golfer-test \
  -p 80:80 -p 443:443 \
  -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile \
  caddy:latest
```
 
Since you won't have real DNS pointed at your machine for a test domain, fake it locally by adding a line to `/etc/hosts`:
 
```
127.0.0.1  test.local
```
 
Then hit `http://test.local` and confirm it actually mirrors the target site's content.
 
Tear down when done:
 
```bash
docker stop golfer-test && docker rm golfer-test
```
 
