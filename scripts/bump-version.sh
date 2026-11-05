#!/usr/bin/env bash
# Increment Displacer's rolling product version (v51 -> v52 -> v53 -> ...).
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"
version_file="$repo_root/VERSION"

if [[ ! -f "$version_file" ]]; then
  printf 'error: VERSION not found at %s\n' "$version_file" >&2
  exit 1
fi

raw_version="$(tr -d '[:space:]' < "$version_file")"
if [[ ! "$raw_version" =~ ^v([1-9][0-9]*)$ ]]; then
  printf 'error: VERSION must contain v followed by a positive integer\n' >&2
  exit 1
fi

current="${BASH_REMATCH[1]}"
next=$((current + 1))
printf 'v%s\n' "$next" > "$version_file"
printf 'Displacer v%s -> v%s\n' "$current" "$next"
printf 'Commit this bump together with the release changes.\n'
