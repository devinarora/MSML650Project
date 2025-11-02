"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nowIso = exports.uuid = exports.TABLE = exports.ddb = void 0;
exports.getClaims = getClaims;
exports.ok = ok;
exports.bad = bad;
exports.cors = cors;
exports.parseBody = parseBody;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const crypto_1 = __importDefault(require("crypto"));
exports.ddb = new client_dynamodb_1.DynamoDBClient({});
exports.TABLE = process.env.TABLE_NAME;
function getClaims(event) {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims?.sub)
        return null;
    return { sub: String(claims.sub), email: claims.email ? String(claims.email) : undefined };
}
function ok(body) {
    return { statusCode: 200, headers: cors(), body: JSON.stringify(body) };
}
function bad(status, message) {
    return { statusCode: status, headers: cors(), body: JSON.stringify({ message }) };
}
function cors() { return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }; }
const uuid = () => crypto_1.default.randomUUID();
exports.uuid = uuid;
const nowIso = () => new Date().toISOString();
exports.nowIso = nowIso;
function parseBody(event) {
    try {
        return event.body ? JSON.parse(event.body) : {};
    }
    catch {
        return {};
    }
}
