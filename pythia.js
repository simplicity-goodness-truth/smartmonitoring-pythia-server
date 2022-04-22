
const port = process.env.PORT || 5007;

var express = require("express");
var app = express();

const Storage = require('./src/Storage');
const config = require('./src/config/internal_config.json');

var log = console.log;
require('console-stamp')(console);


// --------------------Authentication middleware start -------------------------------------

app.use((req, res, next) => {

	var auth;
	const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);

	if ((VCAP_SERVICES.xsuaa[0].credentials.clientid) && (VCAP_SERVICES.xsuaa[0].credentials.clientsecret))

	{
		auth = {
			login: VCAP_SERVICES.xsuaa[0].credentials.clientid,
			password: VCAP_SERVICES.xsuaa[0].credentials.clientsecret.slice(0, 20)
		}

	} else {

		const VCAP_APPLICATION = JSON.parse(process.env.VCAP_APPLICATION);

		auth = {
			login: VCAP_APPLICATION.space_name,
			password: VCAP_APPLICATION.application_name
		}
	}

	// parse login and password from headers

	if (auth) {

		const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
		const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

		// Verify login and password are set and correct

		if (login && password && login === auth.login && password === auth.password) {
			// Access granted
			return next();
		}

		// Access denied
		res.set('WWW-Authenticate', 'Basic realm="401"');
		res.status(401).send('Authentication required.');

	}



}) // app.use((req, res, next)

// --------------------Authentication middleware end -------------------------------------

async function getAnomalityRatingtFromDB(context_id, metric_id, callback) {

	console.log('[PYTHIA] Give us anomaly rating for context_id =', context_id, 'and metric_id =', metric_id);

	let storage = new Storage(

		async function (connection_status) {

			if (connection_status == false)

			{

				console.log('[PYTHIA] There was an error while connecting to HANA database');
				return callback(null);

			} else {


				await storage.GetAnomalityRatingtFromDB(context_id, metric_id, async function (response) {

					var result = response;


					await storage.closeSession();

					if (result) {

						console.log('[PYTHIA] Received ', result.length, ' record(s) from metric_anomaly table');
						console.log('[PYTHIA] Pythia\'s answer is', result[0].METRIC_ABNORMALITY_INDICATOR);

						return callback(result);
					} else {
						return callback(null);
					}

				}); // await storage.GetAnomalityRatingtFromDB

			} // if (connection_status == false)

		}); // let storage = new Storage

}; // async function getAnomalityRatingtFromDB(context_id, metric_id, callback)

async function getAnomalityRatingtFromDbByName(context_name, metric_name, callback) {

	console.log('[PYTHIA] Give us anomaly rating for context_name =', context_name, 'and metric_name =', metric_name);

	let storage = new Storage(

		async function (connection_status) {

			if (connection_status == false)

			{

				console.log('[PYTHIA] There was an error while connecting to HANA database');
				return callback(null);

			} else {

				await storage.GetAnomalityRatingtFromDbByName(context_name, metric_name, async function (response) {

					var result = response;

					await storage.closeSession();

					if (result) {

						console.log('[PYTHIA] Received ', result.length, ' record(s) from metric_anomaly table');
						console.log('[PYTHIA] Pythia\'s answer is', result[0].METRIC_ABNORMALITY_INDICATOR);

						return callback(result);
					} else {
						return callback(null);
					}
				}); // await storage.GetAnomalityRatingtFromDbByName

			} // if (connection_status == false)

		}); // let storage = new Storage

}; // async function getAnomalityRatingtFromDbByName(context_name, metric_name, callback)

async function getThresholdValueFromDB(context_id, metric_id, callback) {

	console.log('[PYTHIA] Give us threshold value for context_id =', context_id, 'and metric_id =', metric_id);

	let storage = new Storage(

		async function (connection_status) {

			if (connection_status == false)

			{

				console.log('[PYTHIA] There was an error while connecting to HANA database');
				return callback(null);

			} else {

				await storage.GetThresholdValueFromDB(context_id, metric_id, async function (response) {

					var result = response;


					await storage.closeSession();

					if (result) {

						console.log('[PYTHIA] Received ', result.length, ' record(s) from thresholds table');
						console.log('[PYTHIA] Pythia\'s answer is', result[0].UPPER_BOUND);

						return callback(result);
					} else {
						return callback(null);
					}

				}); // await storage.GetThresholdValueFromDB

			} // if (connection_status == false)

		}); // let storage = new Storage

}; // async function getThresholdValueFromDB(context_id, metric_id, callback)

async function getThresholdValueFromDbByName(context_name, metric_name, callback) {

	console.log('[PYTHIA] Give us threshold value for context_name =', context_name, 'and metric_name =', metric_name);

	let storage = new Storage(

		async function (connection_status) {

			if (connection_status == false)

			{

				console.log('[PYTHIA] There was an error while connecting to HANA database');
				return callback(null);

			} else {


				await storage.GetThresholdValueFromDbByName(context_name, metric_name, async function (response) {

					var result = response;


					await storage.closeSession();

					if (result) {

						console.log('[PYTHIA] Received ', result.length, ' record(s) from thresholds table');
						console.log('[PYTHIA] Pythia\'s answer is', result[0].UPPER_BOUND);

						return callback(result);
					} else {
						return callback(null);
					}

				}); //await storage.GetThresholdValueFromDbByName

			} // if (connection_status == false)

		}); // let storage = new Storage

}; // async function getThresholdValueFromDbByName

app.listen(port, () => {
	console.log("[PYTHIA] Pythia (MAI backward interface) running on port " + port);
});


app.get('/tip', function (req, res) {

	console.log('[PYTHIA] Someone is calling Pythia with parameters', req.originalUrl);

	var responseValue;
	var requestParameters = {};

	var errorMessage = {
		code: 2,
		value: "MAI backward interface error: record not found"
	};

	var errorMessageString = JSON.stringify(errorMessage, 0);

	errorMessageString = errorMessageString.replace(/\\/g, "");

	// Changing all parameters names to lowercase

	for (i in req.query) {
		requestParameters[i.toLowerCase()] = req.query[i];
	}

	var processing_mode = requestParameters.mode;

	// Calling for anomality rating for a specifc context_id and metric_id


	if ((processing_mode == 'id') || (!processing_mode)) {

		var context_id = requestParameters.context_id;
		var metric_id = requestParameters.metric_id;

		if (context_id && metric_id) // ask for anomality rating if id parameters are entered
		{
			console.log('[PYTHIA] Alert evaluation sequence started...');

			getAnomalityRatingtFromDB(context_id, metric_id, function (result) {

				if (result) {

					if (result.length > 0) {

						responseValue = result[0].METRIC_ABNORMALITY_INDICATOR;

						var pythiaResponse = {
							code: 0,
							value: responseValue
						};

						var pythiaResponseString = JSON.stringify(pythiaResponse, 0);

						res.send(pythiaResponseString);

						console.log('[PYTHIA] Alert evaluation sequence ended');
						console.log('[PYTHIA] Closing session with Pythia');


						//						getThresholdValueFromDB(context_id, metric_id, function (response) {
						//
						//							if ((response) && (response.length > 0)) {
						//
						//
						//								responseValue = result[0].METRIC_ABNORMALITY_INDICATOR + ';' + response[0].UPPER_BOUND;
						//
						//								var pythiaResponse = {
						//									code: 0,
						//									value: responseValue
						//								};
						//
						//								var pythiaResponseString = JSON.stringify(pythiaResponse, 0);
						//
						//
						//								res.send(pythiaResponseString);
						//
						//								console.log('[PYTHIA] Alert evaluation sequence ended');
						//								console.log('[PYTHIA] Closing session with Pythia');
						//
						//							} // if ((response) && (response.length > 0))
						//
						//						}); // 	getThresholdValueFromDB


					} // if (result.length > 0)
					else {

						console.log('[PYTHIA] ERROR: cannot get an anomaly rating snapshot from internal database');
						monitoring_collection = '[PYTHIA] ERROR: cannot get an anomaly rating snapshot from internal database';
						res.send(errorMessage_string);
					}
				} else {

					console.log('[PYTHIA] ERROR: cannot get an anomaly rating snapshot from internal database');
					monitoring_collection = '[PYTHIA] ERROR: cannot get an anomaly rating snapshot from internal database';
					res.send(errorMessageString);

				} //  if (result)

			}); //	getSnapshotFromDB(function (result)


		} else {

			console.log('[PYTHIA] Pythia cannot understand the parameters, she needs context_id and metric_id for prediction');

			errorMessage = {
				code: 1,
				value: 'welcome to MAI backward interface: provide context_id and metric_id'
			};

			errorMessageString = JSON.stringify(errorMessage, 0);
			errorMessageString = errorMessageString.replace(/\\/g, "");

			res.send(errorMessageString);

			console.log('[PYTHIA] Closing session with Pythia');
		}

	} // if (processing_mode == 'id') 


	// Calling for anomality rating for a specifc context_name and metric_name

	if (processing_mode == 'name') {

		var context_name = requestParameters.context_name;
		var metric_name = requestParameters.metric_name;

		if (context_name && metric_name) // ask for anomality rating if id parameters are entered
		{

			console.log('[PYTHIA] Alert evaluation sequence started...');

			getAnomalityRatingtFromDbByName(context_name, metric_name, function (result) {

				if (result) {


					if (result.length > 0) {

						responseValue = result[0].METRIC_ABNORMALITY_INDICATOR;

						var pythiaResponse = {
							code: 0,
							value: responseValue
						};

						var pythiaResponseString = JSON.stringify(pythiaResponse, 0);


						res.send(pythiaResponseString);

						console.log('[PYTHIA] Alert evaluation sequence ended');
						console.log('[PYTHIA] Closing session with Pythia');


						//						getThresholdValueFromDbByName(context_name, metric_name, function (response) {
						//
						//							if ((response) && (response.length > 0)) {
						//
						//								responseValue = result[0].METRIC_ABNORMALITY_INDICATOR + ';' + response[0].UPPER_BOUND;
						//
						//								var pythiaResponse = {
						//									code: 0,
						//									value: responseValue
						//								};
						//
						//								var pythiaResponseString = JSON.stringify(pythiaResponse, 0);
						//
						//
						//								res.send(pythiaResponseString);
						//
						//								console.log('[PYTHIA] Alert evaluation sequence ended');
						//								console.log('[PYTHIA] Closing session with Pythia');
						//							} // if ((response) && (response.length > 0)) 
						//
						//						}); // getThresholdValueFromDbByName

					} // if (result.length > 0)
					else {

						console.log('[PYTHIA] ERROR: cannot get an anomaly rating snapshot from internal database');
						monitoring_collection = '[PYTHIA] ERROR: cannot get an anomaly rating snapshot from internal database';
						res.send(errorMessage_string);
					}
				} else {

					console.log('[PYTHIA] ERROR: cannot get an anomaly rating snapshot from internal database');
					monitoring_collection = '[PYTHIA] ERROR: cannot get an anomaly rating snapshot from internal database';
					res.send(errorMessageString);

				} //  if (result)

			}); //	getSnapshotFromDB(function (result)


		} else {

			console.log('[PYTHIA] Pythia cannot understand the parameters, she needs context_name and metric_name for prediction');

			errorMessage = {
				code: 1,
				value: 'welcome to MAI backward interface: provide context_name and metric_name'
			};
			errorMessageString = JSON.stringify(errorMessage, 0);


			errorMessageString = errorMessageString.replace(/\\/g, "");

			res.send(errorMessageString);

			console.log('[PYTHIA] Closing session with Pythia');
		}

	} //if (processing_mode == 'name')

}); // app.get('/tip', function (req, res)
