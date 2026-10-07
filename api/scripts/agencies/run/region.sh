#!/bin/bash
# Usage: STATES=AC,AM,... bash region.sh <dir>   (run from api/; dir must contain raw.json + backup.json)
set -e
D=$1; R=scripts/agencies/run
node $R/lookup_existing.mjs .env $D
node $R/classify.mjs $D/raw.json $D/candidates.json
node $R/enrich.mjs $D/candidates.json $D/siteinfo.json
node $R/plan.mjs $D
node $R/enrich2.mjs $D
echo PIPELINE_READY
