// StartStage Lambda
// Called by Step Functions when execution enters a new stage.
// Marks the stage item as in_progress (idempotent - won't overwrite an existing status).

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME; // EmployeeOnboardingTable

exports.handler = async (event) => {
  const { employee_id, stage_name } = event;
  const now = new Date().toISOString();

  await ddb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { employee_id, sk: `STAGE#${stage_name}` },
    UpdateExpression:
      "SET #status = if_not_exists(#status, :inprog), " +
      "started_at = if_not_exists(started_at, :now), " +
      "reminder_count = if_not_exists(reminder_count, :zero)",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: {
      ":inprog": "in_progress",
      ":now": now,
      ":zero": 0
    }
  }));

  return { employee_id, stage_name };
};
