"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_1 = require("./util");
const handler = async (event) => {
    const claims = (0, util_1.getClaims)(event);
    if (!claims)
        return (0, util_1.bad)(401, 'Unauthorized');
    const postId = event.pathParameters?.id;
    if (!postId)
        return (0, util_1.bad)(400, 'id required');
    try {
        await util_1.ddb.send(new client_dynamodb_1.DeleteItemCommand({
            TableName: util_1.TABLE,
            Key: { PK: { S: `USER#${claims.sub}` }, SK: { S: `POST#${postId}` } },
            ConditionExpression: 'attribute_exists(PK)'
        }));
        return (0, util_1.ok)({ deleted: true });
    }
    catch {
        return (0, util_1.bad)(403, 'Forbidden or not found');
    }
};
exports.handler = handler;
