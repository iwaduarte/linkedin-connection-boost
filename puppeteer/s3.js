import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";

const s3Client = new S3Client({ region: "sa-east-1" });
const BUCKET_NAME = "random-stuff-idea";

const uploadToS3 = async (fileName) => {
  const fileContent = await fs.readFile(fileName);

  const params = {
    Bucket: BUCKET_NAME,
    Key: `puppeteer-recordings/${fileName}`,
    Body: fileContent,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
};
