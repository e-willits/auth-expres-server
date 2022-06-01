const express = require('express');
const { middleware, errorMiddleware, asyncHandler } = require('@envoy/envoy-integrations-sdk');

const app = express();
/**
 * "middleware()" returns an instance of bodyParser.json,
 * that also verifies the Envoy signature in addition to
 * parsing the request body as JSON.
 */
app.use(middleware());

app.post('/work-schedule', asyncHandler(async (req, res) => {
    const {envoy} = req.envoy;
    req.work()
}));

app.use(errorMiddleware());

const listener = app.listen(process.env.PORT || 0, () => {
  console.log(`Listening on port ${listener.address().port}`);
});
