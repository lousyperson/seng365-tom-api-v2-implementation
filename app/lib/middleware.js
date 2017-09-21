"use strict";

/**
 * various Express middleware functions for authentication and authorization of different forms
 */

const
    log = require('./logger')(),
    config = require('../../config/config.js'),
    users = require('../models/users.model'),
    projects = require('../models/projects.model'),
    creators = require('../models/creators.model');

/**
 * authenticate based on token
 */
const isAuthenticated = (req, res, next) => {
    let token = req.get(config.get('authToken'));
    log.debug(`authenticating ${token}`);
    users.getIdFromToken(token, (err, id) => {
        if (err || id === null) {
            log.warn(`rejected auth attempt for token ${token}`);
            return res.sendStatus(401);
        }
        next();
    })
};

/**
 * authorize as the owner of the user resource given in req.params.id
 */
const isUser = (req, res, next) => {
    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, id) => {
        let userId = req.params.id;
        if ( !Number.isInteger(parseInt(userId)) || id !== parseInt(userId)) {
            log.warn(`rejected attempt to auth ${userId} as ${id}`);
            return res.sendStatus(403);
        }
        next()
    })
};


/**
 * authorize as the owner of the project given in req.params.id
 */
const isProjectOwner = (req, res, next) => {
    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, id) => {
        let projectId = req.params.id;
        if (!Number.isInteger(parseInt(projectId))) {
            log.warn(`rejected attempt to auth ${id} as owner of non-integer ${projectId}`);
            return res.sendStatus(403);
        }
        creators.get(parseInt(projectId), (err, users) => {
            if (err || ! users.includes(id)) { // err shouldn't happen - a project without a creator (unless deleted?)
                log.warn(`rejected attempt to auth ${id} as owner of project ${projectId}`);
                return res.sendStatus(403);
            }
            next()
        })
    })
};

/**
 * ensure not owner of the project given in req.params.id
 */
const isNotProjectOwner = (req, res, next) => {
    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, id) => {
        let projectId = req.params.id;
        if (!Number.isInteger(parseInt(projectId))) {
            log.warn(`rejected attempt to auth as non-owner of non-integer ${projectId}`);
            return res.sendStatus(403);
        }
        creators.get(projectId, (err, users) => {
            if (err || users.includes(id)) { // err shouldn't happen - a project without a creator
                log.warn(`rejected attempt to auth as ${id} because owner of project ${projectId}`);
                return res.sendStatus(403);
            }
            next()
        })
    })
};

/**
 * check that a project is `open` (accepting pledges)
 *
 * TODO: consider moving directly into project controller rather than on route
 */
const isOpen = (req, res, next) => {
    let projectId = req.params.id;
    if (!Number.isInteger(parseInt(projectId))) {
        log.warn(`rejected attempt to auth ${id} as owner of non-integer ${projectId}`);
        return res.sendStatus(403);
    }
    projects.isOpen(projectId, (err, open) => {
        if (err) {
            log.warn(`couldn't check open/closed status of project ${projectId}: ${err}`);
            return res.sendStatus(404);
        }
        if (!open) return res.sendStatus(403);
        next()
    })
};

module.exports = {
    isAuthenticated: isAuthenticated,
    isUser: isUser,
    isProjectOwner: isProjectOwner,
    isNotProjectOwner: isNotProjectOwner,
    isOpen: isOpen
};