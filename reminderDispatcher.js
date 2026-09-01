// ReminderDispatcher Lambda
// Called by Step Functions after a stage has been waiting 24h with no completion.
// Looks up the employee's email from the PROFILE item and sends an SES reminder.

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);
const ses = new SESClient({});

const TABLE_NAME = process.env.TABLE_NAME;
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL; // must be a verified SES identity

const STAGE_LABELS = {
  DOCUMENT_COLLECTION: "Document Collection",
  IT_PROVISIONING: "IT Provisioning",
  POLICY_SIGNOFF: "Policy Sign-off",
  MANAGER_INTRO: "Manager Intro"
};

exports.handler = async (event) => {
  const { employee_id, stage_name } = event;
  const now = new Date().toISOString();
  const stageLabel = STAGE_LABELS[stage_name] || stage_name;

  const profile = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { employee_id, sk: "PROFILE" }
  }));

  const email = profile.Item?.email;
  const fullName = profile.Item?.full_name || "there";
  let reminderSent = false;

  if (email) {
    await ses.send(new SendEmailCommand({
      Source: SES_FROM_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `Reminder: ${stageLabel} is still pending` },
        Body: {
          Text: {
            Data:
              `Hi ${fullName},\n\n` +
              `Your onboarding stage "${stageLabel}" is still pending. ` +
              `Please complete it as soon as possible so we can keep your onboarding on track.\n\n` +
              `Thanks,\nHR Team`
          }
        }
      }
    }));
    reminderSent = true;
  }

  await ddb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { employee_id, sk: `STAGE#${stage_name}` },
    UpdateExpression:
      "SET reminder_count = if_not_exists(reminder_count, :zero) + :one, last_reminder_at = :now",
    ExpressionAttributeValues: { ":zero": 0, ":one": 1, ":now": now }
  }));

  return { employee_id, stage_name, reminderSent };
};
