import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDB({
  region: process.env.AWS_REGION,
});

const db = DynamoDBDocument.from(client);

export { db };
