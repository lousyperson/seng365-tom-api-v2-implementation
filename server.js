"use strict";

/**
 * initialise the database and start the service
 */

const
    config = require('./config/config.js'),
    log = require('./app/lib/logger')({level: config.get('log.level')}),
    initDb = require('./app/lib/db.init'),
    initApp = require('./app/app'),
    port = config.get('port'),
    basepath = config.get('basepath');

initDb(config.get('db'))
    .then(() => initApp(config))
    .then(app => app.listen(port, () => log.info(`listening on localhost:${port}${basepath}`)))
    .catch(err => log.fatal(`could not start app: ${err}`));
