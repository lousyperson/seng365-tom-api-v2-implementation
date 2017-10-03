"use strict";

/**
 * controller methods for the /admin endpoints
 *
 * these endpoints are just for ease of use while testing and developing NOT for any semi-production use!
 */

const
    log = require('../lib/logger')(),
    config = require('../../config/config'),
    initData = require('../../config/sample.data'),
    initDb = require('../lib/db.init');

const reset = (req, res) => {
    log.info('resetting db');
    return initDb(config.get('db'))
        .then(() => initData(config))
        .then(() => res.sendStatus(201))
        .catch(() => res.sendStatus(500));
};

module.exports = {
    reset: reset
};