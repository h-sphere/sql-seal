#!/bin/bash

# Get Release Notes
version="${{ steps.package-version.outputs.VERSION }}"

awk -v version="$version" '
BEGIN { found=0; content="" }
/^# [0-9]+\.[0-9]+\.[0-9]+/ {
    if (found) { exit }
    if ($2 ~ "^"version"($| \\()") { found=1; next }
}
found { content = content $0 "\n" }
END { printf "%s", content }
' CHANGELOG.md > release_notes.txt

cat release_notes.txt >> $NOTES

# Create and push tag
git config user.name "GitHub Actions"
git config user.email "actions@github.com"
git tag -a "${{version}}" -m "Release version ${{version}}"
git push origin "${{version}}"

# Create release
gh release create "${{version}}" \
--title="${{version}}" \
--notes="${{ NOTES }}" \
main.js manifest.json styles.css