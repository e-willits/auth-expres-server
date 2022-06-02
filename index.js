const express = require('express');
const { middleware, errorMiddleware, asyncHandler, EnvoyResponseError, EnvoyAPI } = require('@envoy/envoy-integrations-sdk');
const port = 3000;
const app = express();
/**
 * "middleware()" returns an instance of bodyParser.json,
 * that also verifies the Envoy signature in addition to
 * parsing the request body as JSON.
 */
app.use(middleware());
  
app.get('/', asyncHandler(async (req, res) => {
    const { envoy } = req;  // "envoy" is the SDK
    const {
        userAPI, // user-scoped API calls, used in routes
      } = envoy;

    console.log(envoy);
    res.send('Hello World!');
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

app.post('/work-schedule', asyncHandler(async (req, res) => {
    // const {envoy} = req.envoy;
    // req.work()
}));

app.use(errorMiddleware());

const listener = app.listen(process.env.PORT || 0, () => {
  console.log(`Listening on port ${listener.address().port}`);
});
