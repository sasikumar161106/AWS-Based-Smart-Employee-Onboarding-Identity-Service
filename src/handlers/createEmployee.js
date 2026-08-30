const {
    DynamoDBClient,
    PutItemCommand,
    UpdateItemCommand
} = require('@aws-sdk/client-dynamodb');

const {
    SFNClient,
    StartExecutionCommand
} = require('@aws-sdk/client-sfn');

const { marshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new DynamoDBClient({});
const sfn = new SFNClient({});

const TABLE_NAME = process.env.TABLE_NAME;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;

exports.handler = async (event) => {

    try {

        console.log(
            "Event:",
            JSON.stringify(event, null, 2)
        );

        // Parse request body
        const body = JSON.parse(event.body || '{}');

        // Basic validation
        if (
            !body.full_name ||
            !body.email ||
            !body.department ||
            !body.role
        ) {
            return {
                statusCode: 400,

                headers: {
                    'Access-Control-Allow-Origin': '*'
                },

                body: JSON.stringify({
                    message:
                        "Missing required fields: full_name, email, department, role"
                })
            };
        }

        // Generate employee ID
        const employeeId = uuidv4();

        const timestamp = new Date().toISOString();

        // Prepare DynamoDB profile
        const profileItem = {

            employee_id: employeeId,

            sk: 'PROFILE',

            full_name: body.full_name,

            email: body.email,

            phone: body.phone || 'N/A',

            department: body.department,

            role: body.role,

            manager_id: body.manager_id || 'unassigned',

            joining_date:
                body.joining_date || timestamp,

            employment_type:
                body.employment_type || 'FTE',

            created_at: timestamp,

            updated_at: timestamp,

            record_status: 'PENDING'
        };

        // Create DynamoDB item
        const putCommand = new PutItemCommand({

            TableName: TABLE_NAME,

            Item: marshall(profileItem)

        });

        await dynamodb.send(putCommand);

        console.log(
            `Successfully created employee profile for ${employeeId}`
        );


        // =====================================================
        // COGNITO
        // =====================================================
        // Virajith should add the Cognito AdminCreateUser
        // logic here.
        //
        // IMPORTANT:
        // Step Functions should start ONLY AFTER Cognito
        // provisioning succeeds.
        //
        // Example:
        //
        // const cognitoSub = await createCognitoUser(
        //     body.email,
        //     body.full_name
        // );
        //
        // =====================================================


        // =====================================================
        // STEP FUNCTIONS
        // =====================================================

        if (!STATE_MACHINE_ARN) {

            throw new Error(
                "STATE_MACHINE_ARN environment variable is not configured"
            );
        }

        // Start onboarding workflow
        const execution = await sfn.send(
            new StartExecutionCommand({

                stateMachineArn:
                    STATE_MACHINE_ARN,

                // UUID makes execution name unique
                name:
                    `onboarding-${employeeId}`,

                // This becomes Step Functions input
                input:
                    JSON.stringify({
                        employee_id: employeeId
                    })
            })
        );

        console.log(
            `Started onboarding workflow: ${execution.executionArn}`
        );


        // Save Step Functions execution ARN
        await dynamodb.send(
            new UpdateItemCommand({

                TableName: TABLE_NAME,

                Key: marshall({
                    employee_id: employeeId,
                    sk: 'PROFILE'
                }),

                UpdateExpression:
                    'SET execution_arn = :executionArn',

                ExpressionAttributeValues:
                    marshall({
                        ':executionArn':
                            execution.executionArn
                    })
            })
        );


        // =====================================================
        // SUCCESS RESPONSE
        // =====================================================

        return {

            statusCode: 201,

            headers: {
                'Access-Control-Allow-Origin': '*'
            },

            body: JSON.stringify({

                message:
                    "Employee profile created and onboarding workflow started successfully",

                employee_id:
                    employeeId,

                execution_arn:
                    execution.executionArn
            })
        };


    } catch (error) {

        console.error(
            "Error creating employee:",
            error
        );

        return {

            statusCode: 500,

            headers: {
                'Access-Control-Allow-Origin': '*'
            },

            body: JSON.stringify({

                message:
                    "Internal server error",

                error:
                    error.message
            })
        };
    }
};