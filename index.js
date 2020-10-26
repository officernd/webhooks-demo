const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const { handleSendCustomerReminder, handleSendFarewellEmail } = require('./eventHandlers');

const app = express();
const port = 3000;
const OFFICERND_WEBHOOKS_SECRET = process.env.OFFICERND_WEBHOOKS_SECRET;

function storeRawBody(req, res, buf, encoding) {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
}

app.use(bodyParser.json({ limit: '5mb', verify: storeRawBody }));

function verifyWebhookSignature(rawBody, officerndSignature) {
    if (!officerndSignature) {
        throw new Error('No signature header is present. Request cannot be verified.');
    }

    if (!OFFICERND_WEBHOOKS_SECRET) {
        throw new Error('OFFICERND_WEBHOOKS_SECRET is not set, the webhook event cannot be verified.');
    }

    const signatureHeaderParts = officerndSignature.split(',');
    const timestampParts = signatureHeaderParts[0].split('=');
    const signatureParts = signatureHeaderParts[1].split('=');

    const timestamp = timestampParts[1];
    const signature = signatureParts[1];

    // Optional: verify if timestamp is within the time tolerance

    const payloadToSign = rawBody + '.' + timestamp;
    const mySignature = crypto.createHmac('sha256', OFFICERND_WEBHOOKS_SECRET)
        .update(payloadToSign)
        .digest('hex');

    if (mySignature !== signature) {
        throw new Error('Failed to verify signature');
    }
}

app.post('/webhooks/callback', (req, res) => {
    const { body, rawBody, headers } = req;

    const officerndSignature = headers['officernd-signature'];
    verifyWebhookSignature(rawBody, officerndSignature);

    // acknowledge receipt of event
    res.status(200).send({ status: 'received' });

    const { eventType, data } = body;
    switch (eventType) {
        case 'company.paymentdetails.removed':
            const company = data.company;
            const memberPaymentDetails = data.object;

            handleSendCustomerReminder(company.name, company.email, memberPaymentDetails);
            break;
        case 'member.paymentdetails.removed':
            const member = data.member;
            const teamPaymentDetails = data.object;

            handleSendCustomerReminder(member.name, member.email, teamPaymentDetails);
            break;
        case 'member.removed':
        case 'company.removed':
            const customer = data.object;
            const { name, email } = customer;

            handleSendFarewellEmail(name, email);
            break;
        default:
            // unhandled event
            console.log(`Event ${eventType} was not handled.`);
    }
});

app.listen(port, () => {
  console.log(`webhooks-demo app listening on http://localhost:${port}`)
});

