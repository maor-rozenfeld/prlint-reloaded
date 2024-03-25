#!/usr/bin/env bash

set -e

if TITLE="Add something" \
TITLE_REGEX="^Add" \
ERROR_MESSAGE="N/A" \
./lint.sh; then echo "Pass"; else echo "Failed" && exit 1; fi

if ! TITLE="Add something" \
TITLE_REGEX="^[a-z]" \
ERROR_MESSAGE="Must be lower case" \
./lint.sh; then echo "Pass"; else echo "Failed" && exit 1; fi

if TITLE="Fix a thing" \
TITLE_REGEX="^(?!\\S+ing\\s)(?!\\S+ed\\s)" \
ERROR_MESSAGE="Must be lower case" \
./lint.sh; then echo "Pass"; else echo "Failed" && exit 1; fi

if TITLE="Fix a thing" \
TITLE_REGEX="^(?!\\S+ing\\s)(?!\\S+ed\\s)" \
ERROR_MESSAGE="Must be lower case" \
./lint.sh; then echo "Pass"; else echo "Failed" && exit 1; fi


echo All tests passed