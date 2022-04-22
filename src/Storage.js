
const config = require('./../src/config/internal_config.json');
const cfenv = require("cfenv");

class Storage {

	constructor(callback) {

		// Environment variables HANA_DB_USER_LOGIN, HANA_DB_USER_PASSWORD and HANA_DB_SCHEMA should be set

		const hdb = require('hdb');
		this.connection_status = false;

		this.schemaName = process.env.HANA_DB_SCHEMA || 'SMART_MONITORING';
		const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);

		if (config.execution_environment == 'SCP') {

			// HANA Connection parameters for SCP mode

			const hanaServiceName = VCAP_SERVICES['hana-cloud'][0]['name'];
			const appEnv = cfenv.getAppEnv();
			const hanaCredentials = appEnv.getServiceCreds(hanaServiceName);

			this.client = hdb.createClient({
				host: hanaCredentials.host,
				port: hanaCredentials.port,
				user: process.env.HANA_DB_USER_LOGIN,
				password: process.env.HANA_DB_USER_PASSWORD,
				cert: hanaCredentials.certificate
			});

		} else {

			// HANA Connection parameters for XSA mode

			const hanaCredentials = VCAP_SERVICES.hana[0].credentials;

			this.client = hdb.createClient({
				host: hanaCredentials.host,
				port: hanaCredentials.port,
				user: process.env.HANA_DB_USER_LOGIN,
				password: process.env.HANA_DB_USER_PASSWORD,

			});

		} // if (config.execution_environment == 'SCP')


		this.client.on('error', function (err) {
			console.error('[PYTHIA] [DB INTERFACE] Network connection error during client.on', err);
			return callback(false);
		});


		this.client.connect(function (err) {
			if (err) {
				console.error('[PYTHIA] [DB INTERFACE] HANA database connection error during client.connect');
				console.error(err);

				return callback(false);
			} else {
				return callback(true);
			}
		});

	} // constructor(callback)

	async GetAnomalityRatingtFromDB(context_id, metric_id, callback) {


		var schemaName = this.schemaName;


		var getAllSnapshotItems = 'SELECT top 1 ' +
			schemaName + '.metric_anomaly.metric_abnormality_indicator FROM ' +
			schemaName + '.metric_anomaly WHERE ' +
			schemaName + '.metric_anomaly.context_id=' + '\'' + context_id + '\'' + ' and ' +
			schemaName + '.metric_anomaly.event_type_id=' + '\'' + metric_id + '\'' +
			' order by ' +
			schemaName + '.metric_anomaly.data_collection_timestamp desc';

		this.execsql(getAllSnapshotItems, function (response) {

			return callback(response);
		});

	} //async GetAnomalityRatingtFromDB(context_id, metric_id, callback) 


	async GetAnomalityRatingtFromDbByName(context_name, metric_name, callback) {


		var schemaName = this.schemaName;


		var getAllSnapshotItems = 'SELECT top 1 ' +
			't.metric_abnormality_indicator FROM ' +
			schemaName + '.metric_anomaly t INNER JOIN (select context_id, event_type_id from ' +
			schemaName + '.mai_scope where context_name = ' + '\'' + context_name + '\'' + ' and  ' +
			'mname = ' + '\'' + metric_name + '\'' + ') tm on t.context_id = tm.context_id ' +
			' and t.event_type_id = tm.event_type_id order by t.data_collection_timestamp desc ';

		this.execsql(getAllSnapshotItems, function (response) {

			return callback(response);
		});

	} //async GetAnomalityRatingtFromDbByName(context_name, metric_name, callback)

	async GetThresholdValueFromDB(context_id, metric_id, callback) {

		var schemaName = this.schemaName;

		var getThresholdValueFromDB = 'SELECT top 1 ' +
			schemaName + '.thresholds.upper_bound FROM ' +
			schemaName + '.thresholds WHERE ' +
			schemaName + '.thresholds.context_id=' + '\'' + context_id + '\'' + ' and ' +
			schemaName + '.thresholds.event_type_id=' + '\'' + metric_id + '\'' +
			' order by ' +
			schemaName + '.thresholds.data_collection_timestamp desc';


		this.execsql(getThresholdValueFromDB, function (response) {

			return callback(response);
		});
	} // async GetThresholdValueFromDB(context_id, metric_id, callback)

	async GetThresholdValueFromDbByName(context_name, metric_name, callback) {

		var schemaName = this.schemaName;

		var getThresholdValueFromDB = 'SELECT top 1 ' +
			't.upper_bound FROM ' +
			schemaName + '.thresholds t INNER JOIN (select context_id, event_type_id from ' +
			schemaName + '.mai_scope where context_name = ' + '\'' + context_name + '\'' + ' and  ' +
			'mname = ' + '\'' + metric_name + '\'' + ') tm on t.context_id = tm.context_id ' +
			' and t.event_type_id = tm.event_type_id order by t.data_collection_timestamp desc ';


		this.execsql(getThresholdValueFromDB, function (response) {

			return callback(response);
		});

	} // async GetThresholdValueFromDbByName(context_name, metric_name, callback)


	disconnectSession() {
		this.client.disconnect();
	}

	closeSession() {
		this.client.end();
		return true;
	}

	execsql(statement, callback) {


		this.client.exec(statement, function (err, rows) {

			if (err) {
				return console.error('[PYTHIA] SQL execution error:', err);
			}

			if (rows.length > 0) {


				return callback(rows);

			} else {
				console.log('[PYTHIA] Internal database table does not contain records');
				return callback(0);

			}

		});

	}

	exec(statement) {

		this.client.exec(statement, function (err) {
			if (err) {
				return console.error('[PYTHIA] SQL execution error:', err);
			}


		});
	}
}

module.exports = Storage;
