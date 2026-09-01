// ---- Add this near the top of createEmployee.js, with the other imports ----
const { SFNClient, StartExecutionCommand } = require("@aws-sdk/client-sfn");
const sfn = new SFNClient({});
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;

// ---- Drop this into the TODO block, AFTER the DynamoDB write and the ----
// ---- Cognito AdminCreateUser call have both succeeded ----
await sfn.send(new StartExecutionCommand({
  stateMachineArn: STATE_MACHINE_ARN,
  name: `onboarding-${employee_id}`, // must be unique - employee_id guarantees that
  input: JSON.stringify({ employee_id })
}));
