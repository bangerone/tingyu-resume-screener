// D4 failure-path helper: upload a garbage file claimed as pdf.
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf8");
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"](.*)['"]$/, "$1");
}

const COS = (await import("cos-nodejs-sdk-v5")).default;
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});
const candidateId = "dec1c97e-abc9-4b2b-b574-4605ac17bd2a";
const fileKey = `resumes/${candidateId}/${Date.now()}.pdf`;

const buf = Buffer.from("this is not a real pdf, just garbage bytes 乱码内容");
await new Promise((resolve, reject) => {
  cos.putObject(
    {
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: fileKey,
      Body: buf,
      ContentType: "application/pdf",
    },
    (err, data) => (err ? reject(err) : resolve(data)),
  );
});
console.log("UPLOADED:", fileKey);
