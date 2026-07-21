# Electronic Index Cloud Run

A lightweight Node.js microservice that extracts the number of pages from PDF documents.

The service is designed to be deployed on Google Cloud Run and consumed by Google Apps Script as part of the Electronic Index Project. It receives a PDF as binary data, validates the request, extracts the page count using `pdf-parse`, and returns the result as JSON.

---

## Features

- REST API built with Express.js
- PDF page extraction using `pdf-parse`
- API Key authentication
- File size validation
- Global error handling
- Docker support
- Ready for deployment to Google Cloud Run

---

## Technology Stack

- Node.js
- Express.js
- pdf-parse
- Docker
- Google Cloud Run
- Artifact Registry

---

# Requirements

Before running the project locally, install:

- Node.js 22 or newer
- npm
- Docker Desktop (or Docker Engine)
- Google Cloud CLI (`gcloud`) *(required only for deployment)*
- Git

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
cd electronic-index-cloud-run
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=8080
API_KEY=my-local-key
MAX_FILE_SIZE=xxxxxx
```

---

# Running Locally

Start the development server:

```bash
npm run dev
```

Start the production server:

```bash
npm start
```

The API will be available at:

```
http://localhost:8080
```

---

# Running with Docker

Build the image:

```bash
docker build -t electronic-index-cloud-run .
```

Run the container:

```bash
docker run \
-p 8080:8080 \
--env-file .env \
electronic-index-cloud-run
```

---

# API Endpoints

## Health Check

```
GET /api/v1/health
```

Example:

```bash
curl http://localhost:8080/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "Electronic Index PDF Service is running."
}
```

---

## Extract PDF Information

```
POST /api/v1/pdf/info
```

Headers:

```
Content-Type: application/pdf
X-API-Key: <API_KEY>
```

Example:

```bash
curl \
-X POST \
-H "Content-Type: application/pdf" \
-H "X-API-Key: YOUR_API_KEY" \
--data-binary "@document.pdf" \
http://localhost:8080/api/v1/pdf/info
```

Expected response:

```json
{
  "success": true,
  "data": {
    "pages": 12
  }
}
```

---

# Testing

Health endpoint:

```bash
curl http://localhost:8080/api/v1/health
```

Protected endpoint:

```bash
curl \
-X POST \
-H "Content-Type: application/pdf" \
-H "X-API-Key: YOUR_API_KEY" \
--data-binary "@document.pdf" \
http://localhost:8080/api/v1/pdf/info
```

The service should return the number of pages contained in the PDF.

---

# Deployment

Build the Docker image:

```bash
docker build -t electronic-index-cloud-run .
```

Tag the image:

```bash
docker tag electronic-index-cloud-run:latest \
us-central1-docker.pkg.dev/<PROJECT_ID>/electronic-index/electronic-index-cloud-run:v1
```

Push the image:

```bash
docker push \
us-central1-docker.pkg.dev/<PROJECT_ID>/electronic-index/electronic-index-cloud-run:v1
```

Deploy to Cloud Run:

```bash
gcloud run deploy electronic-index-pdf-service \
--image us-central1-docker.pkg.dev/<PROJECT_ID>/electronic-index/electronic-index-cloud-run:v1 \
--region us-central1 \
--memory 512Mi \
--cpu 1 \
--timeout 30 \
--max-instances 1
```

After deployment, configure the `API_KEY` environment variable in Cloud Run.

---

# Project Structure

```
electronic-index-cloud-run/
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── routes/
│   │     pdf.routes.js
│   │
│   ├── controllers/
│   │     pdf.controller.js
│   │
│   ├── services/
│   │     pdf.service.js
│   │
│   ├── middleware/
│   │     api-key.middleware.js
│   │     error.middleware.js
│   │
│   ├── config/
│   │     env.js
│   │
│   └── utils/
│
├── Dockerfile
├── package.json
├── .env.example
├── README.md
└── docs/
```

---

# Documentation

Additional project documentation is available in the `docs/` directory.

- Technical Design Document
- Deployment Guide
- Architecture Documentation

---

# License

This project is licensed under the MIT License.