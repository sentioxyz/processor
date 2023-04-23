#!/bin/bash

set -e

pnpm install
pnpm --filter "./packages/*" build

pnpm install
pnpm --filter "./packages/cli/templates/**"  build --skip-deps
pnpm --filter "./examples/*" build
