# Webhooks Demo

In this project we demonstrate how OfficeRnD Webhook requests can be handled and verified. Because the webhook callback endpoint needs to be public to allow requests from OfficeRnD, you should ensure that only signed payloads are processed.

## Running the project

### Requirements

- node.js 10 and up
- `ngrok` or another service that exposes localhost web services to the internet

### Running the project

- Install the project dependencies - `npm install`
- Start the server - `node index.js`
- Expose the server to the internet - `ngrok http 3000`
- Set the `OFFICERND_WEBHOOKS_SECRET` environment variable to your webhook secret - `export OFFICERND_WEBHOOKS_SECRET=....`
