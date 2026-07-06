#!/usr/bin/env bash
# Fetch a URL as an agent would — with Accept: text/markdown.
#
#   ./scripts/agent-fetch.sh /blog/making-agent-friendly-pages
#   ./scripts/agent-fetch.sh https://your-deployment.vercel.app/blog/making-agent-friendly-pages
#
# Prints the response headers and the first few lines of the body.
# The server should return Content-Type: text/markdown.

set -euo pipefail

URL="${1:?usage: agent-fetch.sh <url-or-path>}"

# If the argument starts with /, prepend the local dev server URL.
if [[ "$URL" == /* ]]; then
  URL="http://localhost:3000${URL}"
fi

echo "→ Fetching as AGENT (Accept: text/markdown)"
echo "  $URL"
echo ""

# Print headers, then the body
curl -s -D - -H "accept: text/markdown" "$URL" | head -20
