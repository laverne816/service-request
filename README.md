# Service Request API

A basic REST API built with Node.js and Express that lets users create, view, update and delete service requests, with a small front-end form connected to it.

## Live Demo 
https://service-request-q648.onrender.com/


## Screenshot
<img width="1537" height="748" alt="image" src="https://github.com/user-attachments/assets/91cc11e7-2e59-422e-aeee-5722f8ccd9f8" />


## Setup
```bash
npm install
npm start          # or: npm run dev (auto-restart)
```
Open http://localhost:3000 for the front-end. Configuration lives in `.env` (see `.env.example`).

## Endpoints
| Method | Endpoint | Description | Success |
|---|---|---|---|
| GET | /api/health | Health check | 200 |
| GET | /api/requests | List all (optional `?status=open`) | 200 |
| GET | /api/requests/:id | Get one | 200 |
| POST | /api/requests | Create | 201 |
| PUT | /api/requests/:id | Replace whole request | 200 |
| PATCH | /api/requests/:id | Update some fields | 200 |
| DELETE | /api/requests/:id | Delete | 204 |

Errors: `400` validation/invalid JSON, `404` not found, `500` server error.

## Request body
```json
{
  "requesterName": "Thandi",
  "title": "Broken light",
  "description": "Hallway light does not turn on.",
  "category": "Electrical",
  "priority": "high",
  "status": "open"
}
```
Required: `requesterName`, `title`, `description`. `priority`: low | medium | high. `status`: open | in-progress | resolved | closed.

## Testing
Use `tests/api.http` (VS Code REST Client) or import the requests into Postman / Thunder Client. Or with curl:
```bash
curl -X POST http://localhost:3000/api/requests -H "Content-Type: application/json" \
  -d '{"requesterName":"Thandi","title":"Broken light","description":"Hallway light is out"}'
curl http://localhost:3000/api/requests
curl -X PATCH http://localhost:3000/api/requests/1 -H "Content-Type: application/json" -d '{"status":"resolved"}'
curl -X DELETE http://localhost:3000/api/requests/1
```

## Structure
```
server.js                      entry point (loads .env, starts server)
src/app.js                     Express setup + middleware
src/routes/                    URL -> controller mapping
src/controllers/               request handling logic
src/middleware/                logger, validation, error handling
src/data/store.js              in-memory data (resets on restart)
public/                        front-end form (HTML/CSS/JS)
tests/api.http                 API test requests
```

## Concepts covered
HTTP methods, requests/responses, REST principles, JSON, status codes, middleware, environment variables, error handling.
