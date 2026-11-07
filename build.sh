#!/bin/sh
# Builds store packages into dist/. No bundler, just copies and zips src/.
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/chromium dist/firefox
cp -R src/. dist/chromium/
cp -R src/. dist/firefox/
node -e '
const fs = require("fs");
const m = JSON.parse(fs.readFileSync("src/manifest.json", "utf8"));
m.browser_specific_settings = {
  gecko: {
    id: "api-indonesia@apiindonesia.id",
    strict_min_version: "140.0",
    data_collection_permissions: { required: ["authenticationInfo", "locationInfo"] }
  },
  gecko_android: { strict_min_version: "142.0" }
};
fs.writeFileSync("dist/firefox/manifest.json", JSON.stringify(m, null, 2) + "\n");
'
V=$(node -p 'require("./src/manifest.json").version')
(cd dist/chromium && zip -qr -X "../api-indonesia-libur-sholat-$V-chromium.zip" .)
(cd dist/firefox && zip -qr -X "../api-indonesia-libur-sholat-$V-firefox.zip" .)
ls -1 dist/*.zip
