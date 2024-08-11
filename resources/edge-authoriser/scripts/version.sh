#!/bin/bash
VERSION=${GITHUB_RUN_NUMBER:-"0"}
VERSIONLESSPAD=$((10#$VERSION))

COMMIT=${COMMIT:-`git rev-list -1 HEAD --abbrev-commit`}
BRANCH=${BRANCH:-`git rev-parse --abbrev-ref HEAD`}

export MAJORVER="$(node -p -e "require('./package.json').version" | xargs -I% ./scripts/semver get major %)"
export MINORVER="$(node -p -e "require('./package.json').version" | xargs -I% ./scripts/semver get minor %)"
export SEMVER="${MAJORVER}.${MINORVER}.${VERSIONLESSPAD}"

printf "{\n    \"gitHash\": \"$COMMIT\",\n    \"buildBranch\": \"$BRANCH\",\n    \"buildNumber\": \"$SEMVER\",\n    \"buildDate\": \"%s\"\n}\n" $(date +"%Y-%m-%dT%H:%M") > ./src/version.json
