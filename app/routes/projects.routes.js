"use strict";

/**
 * routes for the /projects endpoints
 */

const
    projects = require('../controllers/projects.controller'),
    middleware = require('../lib/middleware'),
    bodyParser = require('body-parser'),
    rawParser = bodyParser.raw({type: 'image/*', limit: '16mb'}), // limit based on max size of MEDIUMBLOB from https://dev.mysql.com/doc/refman/5.5/en/storage-requirements.html#id899830
    jsonParser = bodyParser.json();

module.exports = (router) => {

    router.route('/projects')
          .get(projects.list)
          .post(middleware.isAuthenticated, jsonParser, projects.create);

    router.route('/projects/:id')
          .get(projects.read)
          .put(middleware.isAuthenticated, middleware.isProjectOwner, jsonParser, projects.update);

    router.route('/projects/:id/image')
          .get(projects.readImage)
          .put(middleware.isAuthenticated, middleware.isProjectOwner, rawParser, projects.updateImage);

    router.route('/projects/:id/rewards')
          .get(projects.readRewards)
          .put(middleware.isAuthenticated, middleware.isProjectOwner, jsonParser, projects.updateRewards);

    router.route('/projects/:id/pledge')
          .post(middleware.isAuthenticated, middleware.isNotProjectOwner, middleware.isOpen, jsonParser, projects.addPledge);

};

