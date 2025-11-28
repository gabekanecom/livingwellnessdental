const { S3Client, PutObjectCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || 'us-east-1';
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

console.log('Testing DigitalOcean Spaces connection...');
console.log('Endpoint:', endpoint);
console.log('Region:', region);
console.log('Bucket:', bucket);
console.log('Access Key:', accessKeyId ? accessKeyId.substring(0, 10) + '...' : 'MISSING');

const client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: false,
});

async function testConnection() {
  try {
    // Test 1: List buckets
    console.log('\n--- Test 1: List Buckets ---');
    const listCommand = new ListBucketsCommand({});
    const listResult = await client.send(listCommand);
    console.log('✓ Successfully connected to DigitalOcean Spaces');
    console.log('Available buckets:', listResult.Buckets?.map(b => b.Name).join(', '));
    
    // Test 2: Upload a test file
    console.log('\n--- Test 2: Upload Test File ---');
    const testContent = Buffer.from('test upload');
    const uploadCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: 'test/test-upload.txt',
      Body: testContent,
      ContentType: 'text/plain',
    });
    
    await client.send(uploadCommand);
    console.log('✓ Successfully uploaded test file to', bucket);
    console.log('\nAll tests passed! DigitalOcean Spaces is configured correctly.');
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.$metadata) {
      console.error('Status:', error.$metadata.httpStatusCode);
    }
    console.error('\nFull error:', error);
  }
}

testConnection();
