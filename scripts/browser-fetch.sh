#!/usr/bin/env bash
# Fetch a URL as a browser would — with Accept: text/html.
#
#   ./scripts/browser-fetch.sh /blog/making-agent-friendly-pages
#   ./scripts/browser-fetch.sh https://your-deployment.vercel.app/blog/making-agent-friendly-pages
#
# Prints the response headers and the first few lines of the body.
# The server should return Content-Type: text/html.

set -euo pipefail

URL="${1:?usage: browser-fetch.sh <url-or-path>}"

# If the argument starts with /, prepend the local dev server URL.
if [[ "$URL" == /* ]]; then
  URL="http://localhost:3000${URL}"
fi

echo "→ Fetching as BROWSER (Accept: text/html)"
echo "  $URL"
echo ""

# Print headers, then the body
curl -s -D - -H "accept: text/html" "$URL" | head -20
