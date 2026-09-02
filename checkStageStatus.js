// CheckStageStatus Lambda
// Called by Step Functions after each Wait/reminder cycle to re-check whether
// a stage has been marked complete (by the docs pipeline, IT, or HR action).

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const { employee_id, stage_name } = event;

  const result = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { employee_id, sk: `STAGE#${stage_name}` }
  }));

  const status = result.Item?.status || "pending";

  return {
    employee_id,
    stage_name,
    status,
    isComplete: status === "complete"
  };
};
