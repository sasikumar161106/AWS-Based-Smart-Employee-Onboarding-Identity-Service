const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamodb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
    try {
        const employeeId = event.pathParameters?.employee_id;
        
        if (!employeeId) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: "employee_id is required in path parameters" })
            };
        }

        // Query DynamoDB for all records with PK = employee_id
        // This will fetch PROFILE, STAGE#*, and DOC#* items due to the single-table design
        const queryCommand = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'employee_id = :empId',
            ExpressionAttributeValues: {
                ':empId': { S: employeeId }
            }
        });

        const response = await dynamodb.send(queryCommand);
        
        if (!response.Items || response.Items.length === 0) {
            return {
                statusCode: 404,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: "Employee not found" })
            };
        }

        const items = response.Items.map(item => unmarshall(item));
        
        // Structure the response payload
        const progressData = {
            profile: null,
            stages: {},
            documents: {}
        };

        items.forEach(item => {
            if (item.sk === 'PROFILE') {
                progressData.profile = item;
            } else if (item.sk.startsWith('STAGE#')) {
                const stageName = item.sk.split('#')[1];
                progressData.stages[stageName] = item;
            } else if (item.sk.startsWith('DOC#')) {
                const docType = item.sk.split('#')[1];
                progressData.documents[docType] = item;
            }
        });

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(progressData)
        };

    } catch (error) {
        console.error("Error fetching progress:", error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
};
