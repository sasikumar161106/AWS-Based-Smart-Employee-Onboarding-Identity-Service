const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamodb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
    try {
        // Query the RecordStatusIndex for all active/pending employees
        // By default we look for PENDING onboarding status (or ACTIVE depending on naming convention)
        const statusToQuery = event.queryStringParameters?.status || 'PENDING';

        const queryCommand = new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'RecordStatusIndex',
            KeyConditionExpression: 'record_status = :statusVal AND sk = :skVal',
            ExpressionAttributeValues: {
                ':statusVal': { S: statusToQuery },
                ':skVal': { S: 'PROFILE' } // Only fetch the profile records for the pipeline view
            }
        });

        const response = await dynamodb.send(queryCommand);
        
        const pipelineData = (response.Items || []).map(item => unmarshall(item));

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                count: pipelineData.length,
                employees: pipelineData
            })
        };

    } catch (error) {
        console.error("Error fetching admin pipeline:", error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
};
