#!/usr/bin/env bash


[ -z "$TITLE" ] && echo "Error: TITLE is null or empty" >&2 && exit 1
[ -z "$TITLE_REGEX" ] && echo "Error: TITLE_REGEX is null or empty" >&2 && exit 1
[ -z "$ERROR_MESSAGE" ] && echo "Error: ERROR_MESSAGE is null or empty" >&2 && exit 1

# Match regex title with the title
if grep -qP -- "$TITLE_REGEX" <<< "$TITLE"; then
  echo "Title matches regex: $TITLE_REGEX"
else
  echo "Title does not match regex: $TITLE_REGEX" >&2
  echo "::error title=PR Title is invalid::$ERROR_MESSAGE"
  exit 1
fi