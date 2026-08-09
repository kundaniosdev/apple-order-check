const fs = require("fs");
const jwt = require("jsonwebtoken");

const ISSUER_ID = "664d6bf0-4b0d-4d3b-99b4-6aad6ce3d159";
const KEY_ID = "N5DSDHXQ9V";
const BUNDLE_ID = "com.naapaata.mp3";
const ORDER_ID = "MSHN771TJ9";

const PRIVATE_KEY = fs.readFileSync("./AuthKeys.p8", "utf8");

const now = Math.floor(Date.now() / 1000);

const token = jwt.sign(
  {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 300,
    aud: "appstoreconnect-v1",
    bid: BUNDLE_ID
  },
  PRIVATE_KEY,
  {
    algorithm: "ES256",
    keyid: KEY_ID,
    header: {
      alg: "ES256",
      kid: KEY_ID,
      typ: "JWT"
    }
  }
);

async function lookupOrder() {
  const url =
    `https://api.storekit.itunes.apple.com/inApps/v1/lookup/${encodeURIComponent(ORDER_ID)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log("HTTP Status:", response.status);

  const result = await response.text();
  console.log(result);
}

lookupOrder().catch(console.error);