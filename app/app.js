"use strict";

const
    log = require('./lib/logger')(),
    express = require('express'),
    cors = require('cors'),
    app = express(),
    router = express.Router(),
    db = require('./lib/db');

/**
 * simple status endpoint - just return 200 OK
 * @param req
 * @param res
 */
let status = (req, res) => {
    res.sendStatus(200);
};

/**
 * create an instance of the Express app, pre-configured with routes, and connected to the DB
 *
 * @param config
 * @returns {Promise}
 */
module.exports = config => {
    return new Promise((resolve, reject) => {
        db.connect(config.get('db'), err => {
            if (err) {
                log.fatal(`unable to connect to Database using ${JSON.stringify(config)}`);
                reject(err);
            } else {

                // log the url of all requests
                app.use((req, res, next) => {
                    log.info(`${req.method} ${req.originalUrl}`);
                    next();
                });

                app.use(cors());  // enable CORS for all origins
                app.options('*', cors());  // enable CORS pre-flight, principally in our case for DELETE and PUT requests

                // setup basepath
                app.use(config.get('basepath'), router);

                // establish app routes
                require('./routes/projects.routes')(router);
                require('./routes/users.routes')(router);
                require('./routes/admin.routes')(router);
                router.route('/status').get(status);

                // last, catchall, route to return 404 Not found
                app.use((req, res) => {
                    res.status(404).send('Not found')
                });

                resolve(app);
            }
        })
    })
};
