const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
    try {
        console.log("Event:", JSON.stringify(event, null, 2));
        
        // Parse the request body
        const body = JSON.parse(event.body || '{}');
        
        // Basic validation
        if (!body.full_name || !body.email || !body.department || !body.role) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: "Missing required fields: full_name, email, department, role" })
            };
        }

        const employeeId = uuidv4();
        const timestamp = new Date().toISOString();

        // 1. Prepare DynamoDB Profile Item
        const profileItem = {
            employee_id: employeeId,
            sk: 'PROFILE',
            full_name: body.full_name,
            email: body.email,
            phone: body.phone || 'N/A',
            department: body.department,
            role: body.role,
            manager_id: body.manager_id || 'unassigned',
            joining_date: body.joining_date || timestamp,
            employment_type: body.employment_type || 'FTE',
            created_at: timestamp,
            updated_at: timestamp,
            record_status: 'PENDING'
        };

        const putCommand = new PutItemCommand({
            TableName: TABLE_NAME,
            Item: marshall(profileItem)
        });

        // 2. Write to DynamoDB
        await dynamodb.send(putCommand);
        console.log(`Successfully created employee profile for ${employeeId}`);

        // TODO (Virajith): Integrate Cognito AdminCreateUser here
        // const cognitoSub = await createCognitoUser(body.email, ...);
        // ... update DynamoDB with cognito_sub ...

        // TODO (Chiranthan): Start Step Functions workflow here
        // const executionArn = await startStepFunctionsWorkflow(employeeId);
        // ... update DynamoDB with execution_arn ...

        return {
            statusCode: 201,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ 
                message: "Employee profile created successfully",
                employee_id: employeeId 
            })
        };

    } catch (error) {
        console.error("Error creating employee:", error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
};
