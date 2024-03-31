#!/usr/bin/env bash

set -e

if TITLE="Starts with Starts" \
TITLE_REGEX="^Starts" \
ERROR_MESSAGE="N/A" \
./lint.sh; then echo "Pass"; else echo "Failed" && exit 1; fi

if ! TITLE="Capitalized title" \
TITLE_REGEX="^[a-z]" \
ERROR_MESSAGE="Title must not be capitalized" \
./lint.sh; then echo "Pass"; else echo "Failed" && exit 1; fi

if TITLE="Fix a thing" \
TITLE_REGEX="^(?!\\S+ing\\s)(?!\\S+ed\\s)" \
ERROR_MESSAGE="Must use imperative mood" \
./lint.sh; then echo "Pass"; else echo "Failed" && exit 1; fi

if ! TITLE="Fixing a thing" \
TITLE_REGEX="^(?!\\S+ing\\s)(?!\\S+ed\\s)" \
ERROR_MESSAGE="Must use imperative mood" \
./lint.sh; then echo "Pass"; else echo "Failed" && exit 1; fi

echo All tests passed