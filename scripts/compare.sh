#!/usr/bin/env bash
# Compare what an agent sees vs. what a browser sees for the same URL.
#
#   ./scripts/compare.sh /blog/making-agent-friendly-pages
#   ./scripts/compare.sh https://your-deployment.vercel.app/blog/making-agent-friendly-pages
#
# Fetches the URL with both Accept: text/html and Accept: text/markdown,
# prints the Content-Type, payload size, and estimated token count for each,
# then shows the savings.

set -euo pipefail

URL="${1:?usage: compare.sh <url-or-path>}"

# If the argument starts with /, prepend the local dev server URL.
if [[ "$URL" == /* ]]; then
  URL="http://localhost:3000${URL}"
fi

echo "→ Comparing agent vs. browser for: $URL"
echo ""

# Fetch as HTML (browser)
html_body=$(curl -s -H "accept: text/html" "$URL")
html_type=$(curl -s -D - -o /dev/null -H "accept: text/html" "$URL" | awk 'BEGIN{IGNORECASE=1} /^content-type:/ {gsub("\r",""); print $2}')
html_size=${#html_body}
html_tokens=$(( html_size / 4 ))

# Fetch as markdown (agent)
md_body=$(curl -s -H "accept: text/markdown" "$URL")
md_type=$(curl -s -D - -o /dev/null -H "accept: text/markdown" "$URL" | awk 'BEGIN{IGNORECASE=1} /^content-type:/ {gsub("\r",""); print $2}')
md_size=${#md_body}
md_tokens=$(( md_size / 4 ))

# Calculate savings
if [ "$html_size" -gt 0 ]; then
  byte_savings=$(( 100 - md_size * 100 / html_size ))
else
  byte_savings=0
fi

if [ "$html_tokens" -gt 0 ]; then
  token_savings=$(( 100 - md_tokens * 100 / html_tokens ))
else
  token_savings=0
fi

# Print results
printf "%-12s %-30s %10s %12s\n" "" "Content-Type" "Bytes" "~Tokens"
printf "%-12s %-30s %10s %12s\n" "Browser" "${html_type:-—}" "$html_size" "$html_tokens"
printf "%-12s %-30s %10s %12s\n" "Agent" "${md_type:-—}" "$md_size" "$md_tokens"
echo ""
printf "Payload savings: %s%% (%s bytes)\n" "$byte_savings" "$(( html_size - md_size ))"
printf "Token savings:   %s%% (%s tokens)\n" "$token_savings" "$(( html_tokens - md_tokens ))"

echo ""
echo "--- Agent response (first 10 lines) ---"
echo "$md_body" | head -10
