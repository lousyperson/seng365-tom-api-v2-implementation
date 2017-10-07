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
    initFilename = path.join(__dirname, '../../config/db.init.sql'),
    schemaFilename = path.join(__dirname, '../../config/db.schema.sql');

function rejectDelay(reason) {
    return new Promise(function(resolve, reject) {
        log.info('retrying the database connection');
        setTimeout(reject.bind(null, reason), 2000);
    });
}

/**
 * create schema in the database given by the config object.
 *
 * if `cleanstart` is set in config then first drop all tables then create schema; otherwise create schema only if missing
 *
 * @param config
 * @param force
 * @param sql
 * @returns {Promise}
 */
function initialiseDB(config, force, sql) {
    return new Promise((resolve, reject) => {

        const TABLE_EXISTS_ERRNO = 1050;
        let options = Object.assign({multipleStatements: true}, config);

        let connection = mysql.createConnection(options);
        connection.query(sql, err => {

            connection.end(_err => {
                if (_err) return reject(_err); // safety first - if can't close connection cleanly then try again
                if (!force) {
                    if (!err) return resolve(true); // we've created the schema
                    if (err && err.errno!==TABLE_EXISTS_ERRNO) return reject(err); // an error, and it wasn't because the tables were already there
                    return resolve(false); // the tables were already there, so we didn't do anything
                }
                if (err) return reject(err);
                log.info(`schema created from ${schemaFilename}`);
                return resolve(true)
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
 * @param dbConfig  mysql database configuration object with properties for host, port, user, password and database
 * @param force   if the db schema should be recreated
 * @returns {Promise}
 */
module.exports = (dbConfig, force) => {
    let sql='';
    if (force) {
        sql = fs.readFileSync(initFilename, 'utf8');
        log.info('resetting db')
    }
    sql += fs.readFileSync(schemaFilename, 'utf8');

    let p = initialiseDB(dbConfig, force, sql);
    for (let i = 0; i < 10; i++) {
        p = p.catch(() => initialiseDB(dbConfig, force, sql)).catch(rejectDelay);
    }
    return p;
}