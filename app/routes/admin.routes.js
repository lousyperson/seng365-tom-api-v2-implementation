"use strict";

/**
 * routes for the /admin endpoint
 *
 * currently just a db reset convenience method (but see /status in the main app module)
 */

const admin = require('../controllers/admin.controller');

module.exports = (router) => {

    router.route('/admin/reset')
          .post(admin.reset);

};

