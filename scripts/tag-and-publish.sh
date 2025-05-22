#!/bin/bash

# Get version - you'll need to pass this as an argument or set it another way
if [ -n "$1" ]; then
    version="$1"
else
    # Extract version from package.json more reliably
    version=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    
    # Fallback to grep/sed if node method fails
    if [ -z "$version" ]; then
        version=$(grep '"version":' package.json | head -n1 | sed -E 's/.*"version": "([^"]+)".*/\1/' | tr -d '\n\r')
    fi
fi

# Clean the version string of any whitespace/newlines
version=$(echo "$version" | tr -d '\n\r' | xargs)

# Validate version format
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Invalid version format '$version'. Expected format: x.y.z"
    exit 1
fi

echo "Processing version: $version"


# Check if tag already exists locally
if git tag -l | grep -q "^$version$"; then
    echo "Error: Git tag '$version' already exists locally"
    exit 1
fi

# Check if tag exists on remote
if git ls-remote --tags origin | grep -q "refs/tags/$version$"; then
    echo "Error: Git tag '$version' already exists on remote"
    exit 1
fi

# Check if GitHub release already exists
if gh release view "$version" >/dev/null 2>&1; then
    echo "Error: GitHub release '$version' already exists"
    exit 1
fi

echo "Version checks passed - proceeding with release creation"

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