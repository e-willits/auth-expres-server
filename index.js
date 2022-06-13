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
    'invites.attest',
    'employees.read',
    'reservations.read',
    'reservations.write',
    'spaces.read',
    'work-schedules.read',
    'work-schedules.write',
].join();

const ENTRY_TEST = {
    "data":{
        "attributes":{
            "locality":{ "place-id":"143497"},
            "user-data":{
                "Purpose of visit":"Visiting",
                "Your Email Address":"nicole.j@adomain.tld",
                "Host":"Stephen Arsenault",
                "Your Full Name":"Nicole Jacinto"
            },
            "full-name":"Nicole Jacinto",
            "email":"nicole.j@adomain.tld",
            "private-notes":"This private note is optional and not visible to your visitor",
            "print-badge":false,
            "send-host-notification":false,
            "current-location-id":143497,
            "flow-name":"Visitor",
            "finalized-at":"2022-06-06T15:52:00Z"},
            "relationships":{
                "location":{
                    "data":{
                        "type":"locations",
                        "id":143497
                    }
                },
                "sign-in-user":{
                    "data":{
                        "type":"locations",
                        "id":143497
                    }
                }
            },
            "type":"locations"
        }
    }

/** 
 * Get an access token generated from ENVOY_CLIENT_ID and ENVOY_CLIENT_SECRET provided from env file. 
 * Or use ENVOY_CLIENT_API_KEY which is currently in beta testing. 
 * Also see scopes here: https://developers.envoy.com/hub/docs/scopes#access-scopes for optional list of permissions for the token.
 * Token will eventually expire and is meant only to be used for testing envoyAPI in the brief time this app is ran. 
 * 
*/
async function getAccessToken(AuthURL) {
    var options = {
        'method': 'POST',
        'url': AuthURL,
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
        console.log("Access Token: " + accessToken);
        envoyAPI = new EnvoyAPI(accessToken);
    });
}
// getAccessToken('https://app.envoy.com/a/auth/v0/token');
getAccessToken('https://api.envoy.com/oauth2/token');

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
    /*
    // Test cases

    // Locations
    result.locations = await envoyAPI.location('143497');

    // Companies
    result.company = await envoyAPI.companies(); 

    // Employee Import
    // Possible deprecated API?
    // Try this URL https://app.envoy.com/a/visitors/api/v3/employees/upload
    // result.employeeRecords = await envoyAPI.importEmployeeRecords('asdf', '4d0e94e558795d6a31ec14dde63d6235');

    // Entry
    result.entry = await envoyAPI.entry('108010371');
    result.entryPatch = await envoyAPI.patchEntry({
        'entry-id': '108010371',
        'X-CSRF-Token': '6b742fe43c754d7dc4f14ba67xxxxxxxxbe1d7faca6d38637f37f11xxxxxxxx',
        'Accept': "{\"data\":{\"attributes\":{\"locality\":{\"place-id\":\"143497\"},\"user-data\":{\"Purpose of visit\":\"Visiting\",\"Your Email Address\":\"nicole.j@adomain.tld\",\"Host\":\"Stephen Arsenault\",\"Your Full Name\":\"Nicole Jacinto\"},\"full-name\":\"Nicole Jacinto\",\"email\":\"nicole.j@adomain.tld\",\"private-notes\":\"This private note is optional and not visible to your visitor\",\"print-badge\":false,\"send-host-notification\":false,\"current-location-id\":46424,\"flow-name\":\"Visitor\",\"finalized-at\":\"2019-07-17T10:52:00Z\"},\"relationships\":{\"location\":{\"data\":{\"type\":\"locations\",\"id\":36960}},\"sign-in-user\":{\"data\":{\"type\":\"locations\",\"id\":36960}}},\"type\":\"locations\"}}"
    
    }) 
    result.createEntry = await envoyAPI.createEntry(ENTRY_TEST); 

    result.getEntries = await envoyAPI.getEntriesByDate({
        location: 143497,
        limit: 25,
        offset: 0,
        start_date: '2019-01-02',
        end_date: '2022-06-01'
    })

    // Work Schedule 
    result.workSchedules = await envoyAPI.workSchedules({createdAtAfter: "2021-06-06T15:52:00Z"});   
    result.workSchedule = await envoyAPI.workSchedule('36554098');   
    result.createWorkSchedule = await envoyAPI.createWorkSchedule({
        workSchedule: {
            locationId: 143497,
            email: 'tkla+sdk@envoy.com',
            expectedArrivalAt: '1900-06-06T15:52:00Z'    
        }
    }) 
    // result.deleteWorkSchedule = await envoyAPI.deleteWorkSchedule(36766342); 
          
    // Check In
    result.checkIn = await envoyAPI.checkInWork(36766996);
    result.checkIn = await envoyAPI.checkOutWork(36766996);
     
    */
 
    // Invites
    // result.invites = await envoyAPI.getInvite(29168507);
    // See invites API documentation for all params.
    // result.invites = await envoyAPI.getInvites({
    //     locationId: 143497,
    //     page: 1,
    //     perPage: 100
    // })

    // result.createInvite = await envoyAPI.createInviteV1({
    //     "invite": {
    //         "expectedArrivalAt": "2011-12-03T10:15:30Z",
    //         "invitee": {
    //             "name": "Benny Ka"
    //         },
    //         "locationId": 143497
    
    //     } 
    // });  

    // result.updateInvite = await envoyAPI.updateInviteV1(36947980,{
    //     "invite": {
    //         "expectedArrivalAt": "2010-12-03T10:15:30Z",
    //         "invitee": {
    //             "name": "Who?"
    //         },
    //         "locationId": 143497
    
    //     }
    // })
    // result.removeInvite = await envoyAPI.removeInvite(36752252);
    
    
    // Reservations.
    // result.reserve = await envoyAPI.reservations(); 
    // result.reserve = await envoyAPI.reservation(2); 
    // result.reserve = await envoyAPI.createReservation(); 
    // result.reserve = await envoyAPI.checkInReservation(3);
    // result.reserve = await envoyAPI.checkOutReservation(234);
    // result.reserve = await envoyAPI.cancelReservation(4);

    // Spaces
    // result.space = await envoyAPI.space(324);
    // result.spaces = await envoyAPI.spaces({
    //     locationIds: 143497,
    //     page: 1,
    //     perPage: 100
    // });
    
    res.send(result);  
}));  

app.get('/login', asyncHandler(async (req, res) => {
    //https://app.envoy.com/a/auth/v0/authorize?response_type=code&client_id=&redirect_uri={/redirected}&scope=locations.read+token.refresh
    res.send("Hello");
}))

app.get('/redirect', asyncHandler(async (req, res) => {
    res.send();
}))
 
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