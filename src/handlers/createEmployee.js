const {
    DynamoDBClient,
    PutItemCommand,
    UpdateItemCommand
} = require('@aws-sdk/client-dynamodb');

const {
    SFNClient,
    StartExecutionCommand
} = require('@aws-sdk/client-sfn');

const {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminAddUserToGroupCommand,
    AdminGetUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const { marshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new DynamoDBClient({});
const sfn = new SFNClient({});
const cognito = new CognitoIdentityProviderClient({});

const TABLE_NAME = process.env.TABLE_NAME;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;
const USER_POOL_ID = process.env.USER_POOL_ID;
const EMPLOYEES_GROUP = process.env.EMPLOYEES_GROUP || 'Employees';


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
        // COGNITO IDENTITY PROVISIONING (Virajith - Identity & Auth)
        // =====================================================
        let cognitoSub = null;

        if (USER_POOL_ID) {
            console.log(`Provisioning Cognito account for ${body.email}...`);

            try {
                const createUserParams = {
                    UserPoolId: USER_POOL_ID,
                    Username: body.email,
                    UserAttributes: [
                        { Name: 'email', Value: body.email },
                        { Name: 'email_verified', Value: 'true' },
                        { Name: 'name', Value: body.full_name }
                    ],
                    DesiredDeliveryMediums: ['EMAIL']
                };

                const createUserResult = await cognito.send(
                    new AdminCreateUserCommand(createUserParams)
                );

                const subAttribute = createUserResult.User?.Attributes?.find(
                    (attr) => attr.Name === 'sub'
                );
                cognitoSub = subAttribute ? subAttribute.Value : createUserResult.User?.Username;

                console.log(`Successfully created Cognito user with sub: ${cognitoSub}`);
            } catch (cognitoError) {
                if (cognitoError.name === 'UsernameExistsException' || cognitoError.code === 'UsernameExistsException') {
                    console.log(`User ${body.email} already exists in Cognito. Fetching existing account...`);
                    try {
                        const getUserResult = await cognito.send(
                            new AdminGetUserCommand({
                                UserPoolId: USER_POOL_ID,
                                Username: body.email
                            })
                        );
                        const subAttribute = getUserResult.UserAttributes?.find(
                            (attr) => attr.Name === 'sub'
                        );
                        cognitoSub = subAttribute ? subAttribute.Value : getUserResult.Username;
                    } catch (fetchError) {
                        console.warn(`Could not fetch existing Cognito user:`, fetchError.message);
                    }
                } else {
                    console.error(`Cognito user creation error:`, cognitoError);
                }
            }

            // Add user to Employees group for role-based access control
            try {
                await cognito.send(
                    new AdminAddUserToGroupCommand({
                        UserPoolId: USER_POOL_ID,
                        Username: body.email,
                        GroupName: EMPLOYEES_GROUP
                    })
                );
                console.log(`Added user ${body.email} to Cognito group '${EMPLOYEES_GROUP}'`);
            } catch (groupError) {
                console.warn(`Could not add user to group ${EMPLOYEES_GROUP}:`, groupError.message);
            }

            // Save cognito_sub into DynamoDB profile record
            if (cognitoSub) {
                await dynamodb.send(
                    new UpdateItemCommand({
                        TableName: TABLE_NAME,
                        Key: marshall({
                            employee_id: employeeId,
                            sk: 'PROFILE'
                        }),
                        UpdateExpression: 'SET cognito_sub = :sub',
                        ExpressionAttributeValues: marshall({
                            ':sub': cognitoSub
                        })
                    })
                );
            }
        } else {
            console.warn("USER_POOL_ID environment variable is not configured. Skipping Cognito provisioning.");
        }

        // =====================================================
        // STEP FUNCTIONS (Phase 2 Workflow Engine)
        // =====================================================
        let executionArn = null;

        if (STATE_MACHINE_ARN) {
            try {
                // Start onboarding workflow
                const execution = await sfn.send(
                    new StartExecutionCommand({
                        stateMachineArn: STATE_MACHINE_ARN,
                        name: `onboarding-${employeeId}`,
                        input: JSON.stringify({
                            employee_id: employeeId
                        })
                    })
                );

                executionArn = execution.executionArn;
                console.log(`Started onboarding workflow: ${executionArn}`);

                // Save Step Functions execution ARN
                await dynamodb.send(
                    new UpdateItemCommand({
                        TableName: TABLE_NAME,
                        Key: marshall({
                            employee_id: employeeId,
                            sk: 'PROFILE'
                        }),
                        UpdateExpression: 'SET execution_arn = :executionArn',
                        ExpressionAttributeValues: marshall({
                            ':executionArn': executionArn
                        })
                    })
                );
            } catch (sfnError) {
                console.warn("Failed to start Step Functions workflow:", sfnError.message);
            }
        } else {
            console.warn("STATE_MACHINE_ARN environment variable is not configured. Skipping Step Functions workflow.");
        }


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