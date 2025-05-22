#!/bin/bash

# Get version - you'll need to pass this as an argument or set it another way
version="${1:-$(cat package.json | grep '"version":' | sed -E 's/.*"version": "([^"]+)".*/\1/')}"

if [ -z "$version" ]; then
    echo "Error: No version specified. Pass version as argument or ensure package.json exists."
    exit 1
fi

echo "Processing version: $version"

# Get Release Notes
awk -v version="$version" '
BEGIN { found=0; content="" }
/^# [0-9]+\.[0-9]+\.[0-9]+/ {
    if (found) { exit }
    if ($2 ~ "^"version"($| \\()") { found=1; next }
}
found { content = content $0 "\n" }
END { printf "%s", content }
' CHANGELOG.md > release_notes.txt

# Set NOTES variable to the content of release_notes.txt
NOTES=$(cat release_notes.txt)

# Create and push tag
git config user.name "GitHub Actions"
git config user.email "actions@github.com"
git tag -a "$version" -m "Release version $version"
git push origin "$version"

# Create release
gh release create "$version" \
--title="$version" \
--notes="$NOTES" \
main.js manifest.json styles.css