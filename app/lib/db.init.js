"use strict";

/**
 * initialise the db with a clean application schema
 */

const
    log = require('./logger')(),
    path = require('path'),
    fs = require('fs'),
    mysql = require('mysql');

const
    schemaFilename = path.join(__dirname, '../../config/db.schema.sql');

function rejectDelay(reason) {
    return new Promise(function(resolve, reject) {
        log.info('retrying the database connection');
        setTimeout(reject.bind(null, reason), 2000);
    });
}

/**
 * create schema in the database given by the config object. if the database is not a mysql built-in, use it instead
 * of mysql.
 *
 * @param config   mysql database configuration object with properties for host, port, user, password and database
 * @returns {Promise}
 */
function initialiseDB(config) {
    return new Promise((resolve, reject) => {

        let schema = fs.readFileSync(schemaFilename, 'utf8');
        let options = Object.assign({multipleStatements: true}, config);

        let connection = mysql.createConnection(options);

        connection.query(schema, (err, results) => {
            if (err) return reject(err);
            log.info(`schema created from ${schemaFilename}`);
            connection.end(err => {
                if (err) return reject(err);
                return resolve(results)
            });

        })
    })
}

/**
 * initialise the db with a clean application schema. We establish the db connection ourselves
 * as we need multipleStatements=true for the SQL in the schema file, and don't want this in normal operation.
 *
 * if the config is undedefined or null then Reject. The Retry code is based on the first pattern in https://stackoverflow.com/questions/38213668/promise-retry-design-patterns
 * for a recursive approach to retries, see the initApp() code in the api-test repo.
 *
 * @param config    mysql database configuration object with properties for host, port, user, password and database
 * @returns {Promise}
 */
module.exports = config => {
    if (!config) {
        return Promise.reject('No config');
    } else {
        log.info(`initialising db with ${JSON.stringify(config)}`);
        let p = initialiseDB(config);
        for (let i = 0; i < 10; i++) {
            p = p.catch(() => initialiseDB(config)).catch(rejectDelay);
        }
        return p;
    }
};