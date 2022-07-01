const express = require("express");
const request = require("request");
const axios = require("axios").default;
const {
	middleware,
	errorMiddleware,
	asyncHandler,
	EnvoyAPI,
} = require("@envoy/envoy-integrations-sdk"); 
const PORT = 3000;
const app = express();

const cors = require("cors");
app.use(cors());

// Define scope for token here
const TOKEN_SCOPE = [
	"token.refresh",
	"locations.read",
	"flows.read",
	"work-schedules.read",
];
app.use(middleware());
app.use(errorMiddleware());

/**
 * Get an access token generated from ENVOY_CLIENT_ID and ENVOY_CLIENT_SECRET provided from env file.
 * Or use ENVOY_CLIENT_API_KEY which is currently in beta testing.
 * Also see scopes here: https://developers.envoy.com/hub/docs/scopes#access-scopes for optional list of permissions for the token.
 * Token will eventually expire and is meant only to be used for testing envoyAPI in the brief time this app is ran.
 *
 */
const getAccessToken = async (
	AuthURL,
	apiKey = process.env.ENVOY_CLIENT_API_KEY,
	devUser = process.env.API_USERNAME,
	devPassword = process.env.API_USER_PASSWORD
) => {
	var options = {
		method: "POST",
		url: AuthURL,
		headers: {
			Authorization: "Basic " + apiKey,
			json: true,
		},
		formData: {
			username: devUser,
			password: devPassword,
			scope: TOKEN_SCOPE.join(),
			grant_type: "password",
		},
	};

	return new Promise((resolve, reject) => {
		request(options, async (error, response) => {
			if (error) throw new Error(error);
			let accessToken = JSON.parse(response.body).access_token;
			let refreshToken = JSON.parse(response.body).refresh_token;
			console.log(
				"\nAccess Token: " + accessToken + "\n",
				"\nRefresh Token: " + refreshToken
			);
			let returnAPI = await new EnvoyAPI(accessToken);
			resolve(returnAPI);
		});
	});
};

const getAccessTokenFromAuthCode = async (
	authCode,
	clientID = process.env.ENVOY_CLIENT_ID,
	clientSecret = process.env.ENVOY_CLIENT_SECRET
) => {
	let headers = {
		"Content-Type": "application/json",
	};

	let dataString = JSON.stringify({
		grant_type: "authorization_code",
		code: authCode,
		client_id: clientID,
		client_secret:clientSecret
	});

	let options = {
		url: "https://app.envoy.com/a/auth/v0/token",
		method: "POST",
		headers: headers,
		body: dataString,
	};

	return new Promise((resolve, reject) => {
		request(options, async (error, response) => {
			if (error) throw new Error(error);
			console.log("RES", JSON.parse(response.body));
			let accessToken = JSON.parse(response.body).access_token;
			let refreshToken = JSON.parse(response.body).refresh_token;

            //calc expiration date
            let now = new Date();
            let expirationDate = new Date(now.getTime() + ((JSON.parse(response.body).expires_in)*1000));
            let expirationTime = expirationDate.getTime();
            console.log("expiration date", expirationDate);
            console.log("expiration time", expirationTime);

			resolve({ accessToken, refreshToken, expirationTime });
		});
	});
};

const getAccessTokenFromRefresh = async (
    refreshToken,
    clientID = process.env.ENVOY_CLIENT_ID,
	clientSecret = process.env.ENVOY_CLIENT_SECRET
) => {
    let headers = {
		"Content-Type": "application/json",
	};

	let dataString = JSON.stringify({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: clientID,
		client_secret: clientSecret,
	});

	let options = {
		url: "https://app.envoy.com/a/auth/v0/token",
		method: "POST",
		headers: headers,
		body: dataString,
	};

    return new Promise((resolve, reject) => {
		request(options, async (error, response) => {
			if (error) throw new Error(error);
			console.log("RES", JSON.parse(response.body));
			let accessToken = JSON.parse(response.body).access_token;
			let refreshToken = JSON.parse(response.body).refresh_token;

            //calc expiration date
            let now = new Date();
            let expirationDate = new Date(now.getTime() + ((JSON.parse(response.body).expires_in)*1000));
            let expirationTime = expirationDate.getTime();
            console.log("expiration date", expirationDate);
            console.log("expiration time", expirationTime);

			resolve({ accessToken, refreshToken, expirationTime });
		});
	});
}


app.get("/data-dev", asyncHandler(async (req, res) => {
		let envoyAPI = await getAccessToken(
			"https://api.envoy.com/oauth2/token"
		);

		let result = {};
		let locations = await envoyAPI.locations();
		let reducedLocations = locations.map((location) => {
			return { id: location.id, name: location.attributes.name };
		});
		let flows = await envoyAPI.flows();
		let reducedFlows = flows.map((flow) => {
			return {
				id: flow.id,
				name: flow.attributes.name,
				locationID: flow.relationships.location.data.id,
			};
		});
		result.flows = reducedFlows;
		result.locations = reducedLocations;

		res.send(result);
	})
);

//GET User Data {@locations @flows} with access token
app.post("/data-with-access-token", asyncHandler(async (req, res) => {
    let envoyAPI = await new EnvoyAPI(req.body.accessToken);

    let result = {};
    let locations = await envoyAPI.locations();
    let reducedLocations = locations.map((location) => {
        return { id: location.id, name: location.attributes.name };
    });
    let flows = await envoyAPI.flows();
    let reducedFlows = flows.map((flow) => {
        return {
            id: flow.id,
            name: flow.attributes.name,
            locationID: flow.relationships.location.data.id,
        };
    });
    result.flows = reducedFlows;
    result.locations = reducedLocations;

    res.send(result);
}))

//GET Access Token with auth code - on first login only
app.post("/get-tokens-from-auth-code", asyncHandler(async (req, res) => {
        let authCode = req.body.authCode;
        console.log("express request", authCode);
		let envoyTokens = await getAccessTokenFromAuthCode(
			authCode
		);
        res.send(envoyTokens);
	})
);

//Refresh access token with refresh token
app.post("/refresh-tokens", asyncHandler(async (req, res) => {
    let refreshToken = req.body.refreshToken;
    console.log("refresh token", refreshToken);
    let newAccessTokenInfo = await getAccessTokenFromRefresh(
        refreshToken
    );
    res.send(newAccessTokenInfo);
}))

app.listen(3000, function () {
	console.log("Server is running on localhost3000");
});

/* const listener = app.listen(process.env.PORT || 0, () => {
    console.log(`Listening on port ${listener.address().port}`);
}); */
