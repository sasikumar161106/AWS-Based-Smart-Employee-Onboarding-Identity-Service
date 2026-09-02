// MarkStageComplete Lambda
// Suggested route (coordinate with Sasi to add to API Gateway):
//   PATCH /stage/{employee_id}/{stage_name}/complete
// Used for stages that don't have their own upload/event trigger
// (IT Provisioning, Policy Sign-off, Manager Intro) - HR or IT clicks
// "mark complete" in the dashboard, which hits this endpoint.
// Document Collection is instead marked complete by Ayan/Shashank's
// upload-validation Lambda once all 3 documents are verified.

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const { employee_id, stage_name } = event.pathParameters;
  const now = new Date().toISOString();

  await ddb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { employee_id, sk: `STAGE#${stage_name}` },
    UpdateExpression: "SET #status = :complete, completed_at = :now",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":complete": "complete", ":now": now }
  }));

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ employee_id, stage_name, status: "complete" })
  };
};
