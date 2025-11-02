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
    const patch = (0, util_1.parseBody)(event);
    const sets = [];
    const names = {};
    const values = {};
    if (typeof patch.title === 'string') {
        names['#t'] = 'title';
        values[':t'] = { S: patch.title };
        sets.push('#t = :t');
    }
    if (typeof patch.content === 'string') {
        names['#c'] = 'content';
        values[':c'] = { S: patch.content };
        sets.push('#c = :c');
    }
    if (!sets.length)
        return (0, util_1.bad)(400, 'nothing to update');
    try {
        await util_1.ddb.send(new client_dynamodb_1.UpdateItemCommand({
            TableName: util_1.TABLE,
            Key: { PK: { S: `USER#${claims.sub}` }, SK: { S: `POST#${postId}` } },
            UpdateExpression: `SET ${sets.join(', ')}`,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ConditionExpression: 'attribute_exists(PK)'
        }));
        return (0, util_1.ok)({ updated: true });
    }
    catch {
        return (0, util_1.bad)(403, 'Forbidden or not found');
    }
};
exports.handler = handler;
