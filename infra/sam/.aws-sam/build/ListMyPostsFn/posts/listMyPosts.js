"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const util_1 = require("./util");
const handler = async (event) => {
    const claims = (0, util_1.getClaims)(event);
    if (!claims)
        return (0, util_1.bad)(401, 'Unauthorized');
    const out = await util_1.ddb.send(new client_dynamodb_1.QueryCommand({
        TableName: util_1.TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': { S: `USER#${claims.sub}` },
            ':sk': { S: 'POST#' }
        },
        ScanIndexForward: false, // newest first if you embed createdAt in SK later
    }));
    const items = (out.Items ?? []).map(i => (0, util_dynamodb_1.unmarshall)(i));
    return (0, util_1.ok)(items);
};
exports.handler = handler;
