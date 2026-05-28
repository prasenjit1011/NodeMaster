#!/bin/bash

set -e

echo "========================================="
echo "Building Lambda Packages"
echo "========================================="

mkdir -p zips

for dir in lambdas/*; do

if [ -d "$dir" ]; then

```
LAMBDA_NAME=$(basename "$dir")

echo ""
echo "========================================="
echo "Building: $LAMBDA_NAME"
echo "========================================="

cd "$dir"

if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

zip -r "../../zips/${LAMBDA_NAME}.zip" . \
  -x "*.git*" \
  -x "*.md" \
  -x "README*" \
  -x "*.log"

echo "Created:"
ls -lh ../../zips/${LAMBDA_NAME}.zip

cd ../..
```

fi

done

echo ""
echo "========================================="
echo "All Lambda ZIPs Created Successfully"
echo "========================================="
