const express = require('express');
const request = require('request');
const { middleware, errorMiddleware, asyncHandler, EnvoyResponseError, EnvoyAPI } = require('@envoy/envoy-integrations-sdk');
const PORT = 3000;
const app = express();
let accessToken = '';
let envoyAPI = '';

// Define scope for token here
const TOKEN_SCOPE = [
    'token.refresh', 
    'locations.read', 
    'companies.read',
    'flows.read',
    'invites.read',
    'invites.write',
    'employees.read',
    'reservations.read',
    'reservations.write',
    'work-schedules.read',
    'work-schedules.write',
].join();

/** 
 * Get an access token generated from ENVOY_CLIENT_ID and ENVOY_CLIENT_SECRET provided from env file. 
 * Or use ENVOY_CLIENT_API_KEY which is currently in beta testing. 
 * Also see scopes here: https://developers.envoy.com/hub/docs/scopes#access-scopes for optional list of permissions for the token.
 * Token will eventually expire and is meant only to be used for testing envoyAPI in the brief time this app is ran. 
 * 
*/
async function getAccessToken() {
    var options = {
        'method': 'POST',
        'url': 'https://api.envoy.com/oauth2/token',
        'headers': {
            'Authorization': 'Basic ' + process.env.ENVOY_CLIENT_API_KEY,
            json: true
        },
        formData: {
            'username': process.env.API_USERNAME,
            'password': process.env.API_USER_PASSWORD,
            'scope': TOKEN_SCOPE,
            'grant_type': 'password',
        }
    };
    
    request(options, function (error, response) {
        if (error) throw new Error(error);
        accessToken = JSON.parse(response.body).access_token;
        console.log(accessToken);
        envoyAPI = new EnvoyAPI(accessToken);
    });

}
getAccessToken();

/**
 * "middleware()" returns an instance of bodyParser.json,
 * that also verifies the Envoy signature in addition to
 * parsing the request body as JSON.
 */
app.use(middleware());


/**
 * Default landing page. Place any API calls here to be ran on page load. 
 * A useful company id for testing is 110090, Test Company 1. LocationId : 143497
 */
app.get('/', asyncHandler(async (req, res) => {
    const { envoy } = req;  // "envoy" is the SDK
    let result = {};
    result.locations = await envoyAPI.location('143497');
    // result.createWorkSchedule = await envoyAPI.workSchedule({
    //     'locationId': '143497', 
    //     'email': 'fakefakefake@fakeMail.com', 
    //     'expectedArrivalAt': '2022-06-03T08:00:00.000Z'
    // })
    res.send(result);
}));

app.get('/employee-sign-in', asyncHandler(async (req, res) => {
    const { envoy } = req;

    res.send('Sign In Hook Test');
}));

app.post('/hello-options', (req, res) => {
    res.send([
        {
            label: 'Hello',
            value: 'Hello',
        },
        {
            label: 'Hola',
            value: 'Hola',
        },
        {
            label: 'Aloha',
            value: 'Aloha',
        },
    ]);
});


app.post('/goodbye-options', (req, res) => {
    res.send([
        {
            label: 'Goodbye',
            value: 'Goodbye',
        },
        {
            label: 'Adios',
            value: 'Adios',
        },
        {
            label: 'Aloha',
            value: 'Aloha',
        },
    ]);
});


app.post('/visitor-sign-in', async (req, res) => {
    const envoy = req.envoy; // our middleware adds an "envoy" object to req.
    const job = envoy.job;
    const hello = envoy.meta.config.HELLO;
    const visitor = envoy.payload;
    const visitorName = visitor.attributes['full-name'];

    const message = `${hello} ${visitorName}!`; // our custom greeting
    await job.attach({ label: 'Hello', value: message }); // show in the Envoy dashboard.

    res.send({ hello });
});

app.post('/visitor-sign-out', async (req, res) => {
    const envoy = req.envoy; // our middleware adds an "envoy" object to req.
    const job = envoy.job;
    const goodbye = envoy.meta.config.GOODBYE;
    const visitor = envoy.payload;
    const visitorName = visitor.attributes['full-name'];

    const message = `${goodbye} ${visitorName}!`;
    await job.attach({ label: 'Goodbye', value: message });

    res.send({ goodbye });
});

app.use(errorMiddleware());

const listener = app.listen(process.env.PORT || 0, () => {
    console.log(`Listening on port ${listener.address().port}`);
});
