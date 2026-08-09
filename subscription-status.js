const fs = require("fs");
const jwt = require("jsonwebtoken");

// ============================================================
// APPLE CREDENTIALS
// ============================================================

const ISSUER_ID = "664d6bf0-4b0d-4d3b-99b4-6aad6ce3d159";
const KEY_ID = "N5DSDHXQ9V";
const BUNDLE_ID = "com.naapaata.mp3";

// IMPORTANT:
// Use the ORIGINAL transaction ID from the previous response.
const ORIGINAL_TRANSACTION_ID = "420002728947066";

const PRIVATE_KEY = fs.readFileSync("./AuthKeys.p8", "utf8");

// ============================================================
// CREATE JWT
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
// GET SUBSCRIPTION STATUS
// ============================================================

async function getSubscriptionStatus() {
  const url =
    `https://api.storekit.apple.com/inApps/v1/subscriptions/${encodeURIComponent(
      ORIGINAL_TRANSACTION_ID
    )}`;

  console.log("\n========================================");
  console.log("APPLE SUBSCRIPTION STATUS");
  console.log("========================================");

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

    console.log("\nEnvironment:", data.environment);
    console.log("Bundle ID:", data.bundleId);
    console.log("App Apple ID:", data.appAppleId);

    if (!data.data || data.data.length === 0) {
      console.log("\nNo subscription status data returned.");
      return;
    }

    // ========================================================
    // SUBSCRIPTION GROUPS
    // ========================================================

    for (const [groupIndex, group] of data.data.entries()) {
      console.log("\n========================================");
      console.log(`SUBSCRIPTION GROUP #${groupIndex + 1}`);
      console.log("========================================");

      console.log(
        "Subscription Group ID:",
        group.subscriptionGroupIdentifier ?? "N/A"
      );

      // ------------------------------------------------------
      // Subscription status entries
      // ------------------------------------------------------

      for (const [statusIndex, statusItem] of (
        group.lastTransactions ?? []
      ).entries()) {
        console.log("\n----------------------------------------");
        console.log(`SUBSCRIPTION #${statusIndex + 1}`);
        console.log("----------------------------------------");

        console.log(
          "Status:",
          statusItem.status ?? "N/A"
        );

        console.log(
          "Original Transaction ID:",
          statusItem.originalTransactionId ?? "N/A"
        );

        // ====================================================
        // SIGNED TRANSACTION INFO
        // ====================================================

        if (statusItem.signedTransactionInfo) {
          const transactionParts =
            statusItem.signedTransactionInfo.split(".");

          if (transactionParts.length === 3) {
            const transactionPayload = JSON.parse(
              Buffer.from(
                transactionParts[1],
                "base64url"
              ).toString("utf8")
            );

            console.log("\n---------- TRANSACTION ----------");

            console.log(
              "Transaction ID:",
              transactionPayload.transactionId ?? "N/A"
            );

            console.log(
              "Original Transaction ID:",
              transactionPayload.originalTransactionId ?? "N/A"
            );

            console.log(
              "Product ID:",
              transactionPayload.productId ?? "N/A"
            );

            console.log(
              "Type:",
              transactionPayload.type ?? "N/A"
            );

            console.log(
              "Environment:",
              transactionPayload.environment ?? "N/A"
            );

            if (transactionPayload.purchaseDate) {
              console.log(
                "Purchase Date:",
                new Date(
                  transactionPayload.purchaseDate
                ).toISOString()
              );
            }

            if (transactionPayload.expiresDate) {
              console.log(
                "Expires Date:",
                new Date(
                  transactionPayload.expiresDate
                ).toISOString()
              );
            }

            if (transactionPayload.revocationDate) {
              console.log(
                "Revocation Date:",
                new Date(
                  transactionPayload.revocationDate
                ).toISOString()
              );
            } else {
              console.log(
                "Revocation Date: Not revoked"
              );
            }
          }
        }

        // ====================================================
        // SIGNED RENEWAL INFO
        // ====================================================

        if (statusItem.signedRenewalInfo) {
          const renewalParts =
            statusItem.signedRenewalInfo.split(".");

          if (renewalParts.length === 3) {
            const renewalPayload = JSON.parse(
              Buffer.from(
                renewalParts[1],
                "base64url"
              ).toString("utf8")
            );

            console.log("\n---------- RENEWAL INFO ----------");

            console.log(
              "Original Transaction ID:",
              renewalPayload.originalTransactionId ?? "N/A"
            );

            console.log(
              "Product ID:",
              renewalPayload.productId ?? "N/A"
            );

            console.log(
              "Auto Renew Status:",
              renewalPayload.autoRenewStatus ?? "N/A"
            );

            if (renewalPayload.expirationIntent !== undefined) {
              console.log(
                "Expiration Intent:",
                renewalPayload.expirationIntent
              );
            }

            if (renewalPayload.gracePeriodExpiresDate) {
              console.log(
                "Grace Period Expires:",
                new Date(
                  renewalPayload.gracePeriodExpiresDate
                ).toISOString()
              );
            }

            if (renewalPayload.isInBillingRetryPeriod !== undefined) {
              console.log(
                "Billing Retry:",
                renewalPayload.isInBillingRetryPeriod
              );
            }

            if (renewalPayload.renewalDate) {
              console.log(
                "Renewal Date:",
                new Date(
                  renewalPayload.renewalDate
                ).toISOString()
              );
            }
          }
        }
      }
    }

    console.log("\n========================================");
    console.log("SUBSCRIPTION CHECK COMPLETE");
    console.log("========================================");

  } catch (error) {
    console.error("\nREQUEST ERROR:");
    console.error(error);
  }
}

getSubscriptionStatus();