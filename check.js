require("dotenv").config();
const fs = require("fs");
const jwt = require("jsonwebtoken");

// ============================================================
// APPLE CREDENTIALS
// ============================================================

const ISSUER_ID = process.env.APPLE_ISSUER_ID;
const KEY_ID = process.env.APPLE_KEY_ID;
const BUNDLE_ID = process.env.APPLE_BUNDLE_ID;
const ORDER_ID = process.env.APPLE_ORDER_ID;

// Your Apple private key
const PRIVATE_KEY = fs.readFileSync("./AuthKeys.p8", "utf8");

// ============================================================
// CREATE APP STORE SERVER API JWT
// ============================================================

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
    header: {
      alg: "ES256",
      kid: KEY_ID,
      typ: "JWT"
    }
  }
);

// ============================================================
// LOOK UP ORDER
// ============================================================

async function lookupOrder() {
  const url =
    `https://api.storekit.itunes.apple.com/inApps/v1/lookup/${encodeURIComponent(
      ORDER_ID
    )}`;

  console.log("\n========================================");
  console.log("APPLE ORDER LOOKUP");
  console.log("========================================");

  console.log("Order ID:", ORDER_ID);
  console.log("Bundle ID:", BUNDLE_ID);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    console.log("HTTP Status:", response.status);

    const responseText = await response.text();

    if (!response.ok) {
      console.log("\nAPPLE API ERROR:");
      console.log(responseText);
      return;
    }

    const data = JSON.parse(responseText);

    console.log(
      "Number of transactions:",
      data.signedTransactions?.length ?? 0
    );

    // ========================================================
    // PROCESS SIGNED TRANSACTIONS
    // ========================================================

    for (const [index, signedTransaction] of (
      data.signedTransactions ?? []
    ).entries()) {
      console.log("\n========================================");
      console.log(`TRANSACTION #${index + 1}`);
      console.log("========================================");

      // Full signed transaction
      console.log("\nSIGNED TRANSACTION:");
      console.log(signedTransaction);

      // ------------------------------------------------------
      // Decode JWS payload
      // ------------------------------------------------------

      const parts = signedTransaction.split(".");

      if (parts.length !== 3) {
        console.log("\nInvalid JWS transaction");
        continue;
      }

      try {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64url").toString("utf8")
        );

        console.log("\n---------- TRANSACTION DETAILS ----------");

        console.log(
          "Transaction ID:",
          payload.transactionId ?? "N/A"
        );

        console.log(
          "Original Transaction ID:",
          payload.originalTransactionId ?? "N/A"
        );

        console.log(
          "Product ID:",
          payload.productId ?? "N/A"
        );

        console.log(
          "Type:",
          payload.type ?? "N/A"
        );

        console.log(
          "Environment:",
          payload.environment ?? "N/A"
        );

        console.log(
          "Ownership Type:",
          payload.inAppOwnershipType ?? "N/A"
        );

        console.log(
          "Quantity:",
          payload.quantity ?? "N/A"
        );

        // ----------------------------------------------------
        // Purchase Date
        // ----------------------------------------------------

        if (payload.purchaseDate) {
          console.log(
            "Purchase Date:",
            new Date(payload.purchaseDate).toISOString()
          );
        } else {
          console.log("Purchase Date: N/A");
        }

        // ----------------------------------------------------
        // Expiration Date
        // ----------------------------------------------------

        if (payload.expiresDate) {
          console.log(
            "Expires Date:",
            new Date(payload.expiresDate).toISOString()
          );
        } else {
          console.log("Expires Date: N/A");
        }

        // ----------------------------------------------------
        // Revocation
        // ----------------------------------------------------

        if (payload.revocationDate) {
          console.log(
            "Revocation Date:",
            new Date(payload.revocationDate).toISOString()
          );

          console.log(
            "Revocation Reason:",
            payload.revocationReason ?? "N/A"
          );
        } else {
          console.log("Revocation Date: Not revoked");
          console.log("Revocation Reason: N/A");
        }

        // ----------------------------------------------------
        // Subscription Information
        // ----------------------------------------------------

        console.log(
          "Web Order Line Item ID:",
          payload.webOrderLineItemId ?? "N/A"
        );

        console.log(
          "Subscription Group ID:",
          payload.subscriptionGroupIdentifier ?? "N/A"
        );

        console.log(
          "App Account Token:",
          payload.appAccountToken ?? "N/A"
        );

        // ----------------------------------------------------
        // Full decoded payload
        // ----------------------------------------------------

        console.log("\n---------- FULL DECODED PAYLOAD ----------");

        console.log(
          JSON.stringify(payload, null, 2)
        );

      } catch (decodeError) {
        console.log(
          "\nCould not decode transaction payload:"
        );

        console.log(decodeError.message);
      }
    }

    console.log("\n========================================");
    console.log("LOOKUP COMPLETE");
    console.log("========================================");

  } catch (error) {
    console.log("\nREQUEST ERROR:");
    console.log(error);
  }
}

// ============================================================
// RUN
// ============================================================

lookupOrder();