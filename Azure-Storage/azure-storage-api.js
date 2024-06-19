const { BlobServiceClient } = require('@azure/storage-blob');

const secret = require('./secret');

const AZURE_STORAGE_CONNECTION_STRING = secret.azureStorageAccountKey;
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient('mawi-invoices');

async function uploadFilesToAzure(files) {
    const uploadPromises = files.map(async (file) => {
      let blobName = `${Date.now()}_${file.name}`;
      console.log(`Uploading file: ${blobName}`);
      let blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(file.data);
      let fileUrl = blockBlobClient.url;
      console.log(`File uploaded: ${fileUrl}`);
      return { fileName: file.name, fileUrl };
    });
  
    const uploadedFiles = await Promise.all(uploadPromises);
    return uploadedFiles;
  }
  
  module.exports = { uploadFilesToAzure };