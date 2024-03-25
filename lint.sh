#!/usr/bin/env bash


[ -z "$TITLE" ] && echo "Error: TITLE is null or empty" >&2 && exit 1
[ -z "$TITLE_REGEX" ] && echo "Error: TITLE_REGEX is null or empty" >&2 && exit 1
[ -z "$ERROR_MESSAGE" ] && echo "Error: ERROR_MESSAGE is null or empty" >&2 && exit 1

# Match regex title with the title
if grep -qP -- "$TITLE_REGEX" <<< "$TITLE"; then
  echo "Title matches regex: $TITLE_REGEX"
  echo "verdict=Pass" >> $GITHUB_OUTPUT
else
  echo "Error: Title does not match regex: $TITLE_REGEX" >&2
  echo "$ERROR_MESSAGE" >&2
  echo "verdict=$(echo $ERROR_MESSAGE)" >> $GITHUB_OUTPUT
  exit 1
fi