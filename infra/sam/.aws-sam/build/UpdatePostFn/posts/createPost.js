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
    const body = (0, util_1.parseBody)(event);
    if (!body.title || typeof body.title !== 'string')
        return (0, util_1.bad)(400, 'title is required');
    const postId = (0, util_1.uuid)();
    const createdAt = (0, util_1.nowIso)();
    const item = {
        // PK/SK mapping for Berkay's table:
        PK: `USER#${claims.sub}`,
        SK: `POST#${postId}`,
        // original fields (kept if you still use them on the UI side)
        postId,
        ownerSub: claims.sub,
        title: body.title,
        content: body.content ?? '',
        createdAt,
        // optional feed GSI (uncomment when you add a /feed endpoint)
        // GSI1PK: 'PUBLIC',
        // GSI1SK: createdAt,
    };
    await util_1.ddb.send(new client_dynamodb_1.PutItemCommand({ TableName: util_1.TABLE, Item: (0, util_dynamodb_1.marshall)(item) }));
    return (0, util_1.ok)({ postId, createdAt });
};
exports.handler = handler;
