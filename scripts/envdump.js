const fs = require('fs');

const serviceAccount = {
  "type": "service_account",
  "project_id": "hostelsphere",
  "private_key_id": "e210a0fdf6113ab50b443f74e365b6088773ba1b",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC8uK1uT3aoW5Io\nuzgfnBJxRunOK+UcwD2n1iNCPVVBwbxNh5rR4L74fslFboh+wm5X9qesG5u2id36\nP5pJr1T0Ud2/n6bwWFQzYqgti88M+gLQ+Z92G/K+92DC2EdqoXi/vxrB8+uifcBF\n4c0n59aYDgAA3/5WwwXFz/MAoceg6nInAAKX2QMNn/X6e8H6FUNzdFGzQ+A4jg94\nOfw5rdX07ROYCoBmgKO4X2WG2ETai+Eht3LeaZKPIfIHR4EwKBC2DLAK57Exmja5\nil6cH8h1+hSd+BQzJzKl02SICmcYdYvcGnw6zT6Me3SxTfY+TpiZZYex3pM7VQ+H\nskwRgxVlAgMBAAECggEAE9DqeQ5D/dqbpsY91ufa8eUJ0NnAFXxEHRb5nc9139E5\ndgSap5YLR2l8tdss3u6Iipj+My60835Xfhrmlv0flQXxnFjlvQ/xS3H9CcdH5utr\nl0jWyx6VJyMvmFYAbbxlwvCMnTgBEo9UvKHAmoOX/2Bc9LqQaMjSltpGgFb8cLNv\nJmdkya9DZOZSglbItOzGg56kegmxCHYKe2SQasRzNwDh+Celcun05/yr/CtmuLJg\ng/Po+0LaR9Z4LZMcMR6VlEDP2qEFOz84SFISldUwwEbXjYBVzzI6QJbWsfiOWzzN\nIbRyDcvY5UkRUw+UCDcqn01gpkQBuuLlnbVo6BaMwwKBgQDqgHH4z8e0fz2pGkBx\najzBCQiv4lV1hBflsgCYVzZ7QO/GUZfYf2dNjH3qpBPC6x+E1xeMMA22QEidfUdr\nGup7RuG9bTNPLEdq/5eIJuJipSNCINaTzabYBZQADEMhUeSEyKROLzRik5wfop0Z\nrKauDmlrTags5d6fb3LI6+XlxwKBgQDOBc6OeaoIjlt6LlMfK2c3KV5KuLBAQLBP\njflpRDehG6phpDWMjr/pYO1BV2qKYFNCqoz319Ni7pmkJeGXCEjGHjjWn9RrFoMe\nepmwRkNYxynTDXnEtx6SlVgjquJmDixF6Jpd85Gd0pf+sKZeDi31RtBKKYWVJ8/j\nVw+0WHg7cwKBgQCQvXUbcQw/sWXasVRjbIJRV4UgIqBC56RkZykM3o/HJb6ZdxU1\nUPXvHK8/m8SCw+Nxd92V7rcX7bekVYY2aqeeLZL5+6P200rFlTrvk6iZ4HnRwDkR\ng5besRq3qNnqgAR/nOQlSeeYjKmJsTIsfa9nsYeJ7qXGCKAPYpfDwi7lUwKBgQCZ\ntolrkejEI3qrCV8pNVf4NxxMAco21kz1vkblPGmJAbw4x6zQZz1WoePCybcK8V2N\nsvQkgtoLyVvGtiC/cAXkE25y66MwFwbTOcPrWjErTsWs2zQMClh8I4M0cW4jmNV9\nf1OVX4I4z4RqGWC3cjrl8uS7QImTRLX9t9pWw19JcwKBgQDIlK+xyV5xsCBVdjFU\nPuw2XX9RSZt5M7Vf5mnWMMi5aREy1CNRR7rMjrl54aegLla/A0evK0kdzp0m9tfi\nQOfN3nIXtkiSU++65JNrlD5tTZUHWkKmU9j1Y15iDyLVm2jQg7RL+jsJeGJy/RwW\nSYjIJPQQSLoSKSkV2XXvCkPT7Q==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@hostelsphere.iam.gserviceaccount.com",
  "client_id": "110277788342025229992",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40hostelsphere.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

const str = JSON.stringify(serviceAccount);
fs.appendFileSync('.env', '\\nFIREBASE_SERVICE_ACCOUNT=' + "'" + str + "'\\n");
console.log('Appended to .env');
