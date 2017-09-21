"use strict";

/**
 * database connection.
 *
 * will automatically be a singleton as node modules wih the same absolute filepath are cached
 * and reused by node.
 */

const
    log = require('./logger')({'name': 'db'}),
    mysql = require('mysql');

let connectionPool = null; // must be outside module.exports to remain as private to module

/**
 * obtain a connection from a pool established previously by `connect`
 */
const get = () => {
    return connectionPool;
};

/**
 * establish a connection to the database; if one already exists, close it first before creating the new one
 */
const connect = (config, done) => {
    if (!connectionPool) {
        log.debug(`creating new connection pool using ${JSON.stringify(config)}`);
        connectionPool = mysql.createPool(config);
    }
    done();
};

/**
 * close the connection pool, once any open connections have finished
 */
const end = done => {
    connectionPool.end(() => { // warning: we ignore errors
        log.debug('closed connection pool');
        connectionPool = null;
        done()
    });
};

module.exports = {
    get: get,
    connect: connect,
    end: end
};
