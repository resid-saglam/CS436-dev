const mysql = require("mysql2/promise");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

const REGION = process.env.AWS_REGION || "eu-west-1";
const sm = new SecretsManagerClient({ region: REGION });
const ses = new SESv2Client({ region: REGION });

exports.handler = async (event) => {
  // Fetch DB creds from Secrets Manager (RDS-managed secret).
  // Shape: {username, password, engine, host, port, dbname, dbInstanceIdentifier}
  const secret = await sm.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }),
  );
  const creds = JSON.parse(secret.SecretString);

  // Connect to RDS using the Route 53 alias (NOT creds.host — see step-20.md Prerequisites).
  // dbname is null in the RDS-managed secret; use env var instead.
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: creds.username,
    password: creds.password,
    database: process.env.DB_NAME,
    // TLS to RDS WITHOUT strict cert pinning — matches the backend's proven
    // config (config/db.js uses ssl:{require:true, rejectUnauthorized:false}).
    // Do NOT use ssl:"Amazon RDS" — that pins to mysql2's bundled CA bundle,
    // which may not include the RDS instance's CA (rds-ca-rsa2048-g1) and then
    // the connection fails cert verification even though the backend connects fine.
    ssl: { rejectUnauthorized: false },
    connectTimeout: 10000,
  });

  const [rows] = await conn.execute(
    "SELECT name, quantityInStocks FROM Products WHERE quantityInStocks < ? ORDER BY quantityInStocks ASC",
    [parseInt(process.env.LOW_STOCK_THRESHOLD || "5", 10)],
  );
  await conn.end();

  if (rows.length === 0) {
    console.log("No low-stock products.");
    return { statusCode: 200, body: "No low-stock products." };
  }

  const body = rows
    .map((r) => `- ${r.name}: ${r.quantityInStocks} in stock`)
    .join("\n");

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: process.env.EMAIL_FROM,
      Destination: { ToAddresses: [process.env.PM_EMAIL] },
      Content: {
        Simple: {
          Subject: { Data: `Daily low-stock report — ${rows.length} item(s)` },
          Body: {
            Text: {
              Data: `${rows.length} product(s) below threshold:\n\n${body}\n\n— cs436-ecommerce low-stock-notifier`,
            },
          },
        },
      },
    }),
  );

  console.log(`Notified PM about ${rows.length} low-stock product(s).`);
  return {
    statusCode: 200,
    body: `Notified PM about ${rows.length} product(s).`,
  };
};