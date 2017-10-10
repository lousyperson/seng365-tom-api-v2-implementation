"use strict";

/**
 * controller methods for the /users endpoints
 */

const
    log = require('../lib/logger')(),
    schema = require('../../config/swagger-api-v2.1.6.json'),
    config = require('../../config/config'),
    users = require('../models/users.model'),
    validator = require('../lib/validator');


/**
 * create a new user, from a request body that follows the `User` schema definition
 */
const create = (req, res) => {
    if (!validator.isValidSchema(req.body, 'definitions.User')) {
        log.warn(`users.controller.create: bad user ${JSON.stringify(req.body)}`);
        return res.sendStatus(400);
    }
    else {
        let user = Object.assign({}, req.body);
        users.insert(user, (err, id) => {
            if (err)
            {
                log.warn(`user.controller.create: couldn't create ${JSON.stringify(user)}: ${err}`);
                return res.sendStatus(400); // duplicate record
            }
            res.status(201).json({id:id});
        })
    }
};

/**
 * return details for the user given by the request param :id
 * (auth required in v2+)
 */
const read = (req, res) => {
    let id = parseInt(req.params.id);
    if (!validator.isValidId(id)) return res.sendStatus(404);

    users.getOne(id, true, (err, results) => {
        if (err)
            return res.sendStatus(500);
        if (!results)  // no user found
            return res.sendStatus(404);
        res.status(200).json(results);
    })
};

/**
 * update the user given by request param :id from a request body that follows the `User` schema definition
 * (auth required)
 */
const update = (req, res) => {
    let id = parseInt(req.params.id);
    if (!validator.isValidId(id)) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if (_id !== id)
            return res.sendStatus(403);
        if (!validator.isValidSchema(req.body, 'definitions.User')) {
            log.warn(`users.controller.update: bad user ${JSON.stringify(req.body)}`);
            return res.sendStatus(400);
        }
        let user = Object.assign({}, req.body);
        users.alter(_id, user, err => {
            if (err)
                return res.sendStatus(500);
            return res.sendStatus(200);
        })
    })
};

/**
 * delete the user given by request param :id
 * (auth required)
 */
const remove = (req, res) => {
    let id = parseInt(req.params.id);
    if (!validator.isValidId(id)) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if (_id !== id)
            return res.sendStatus(403);
        else
            users.remove(_id, err => {
                if (err)
                    return res.sendStatus(500);
                return res.sendStatus(200)
            })
    })
};

/**
 * authenticate the user given by the query parameters `username` or `email`, and `password`
 */
const login = (req, res) => {
    validator.areValidParameters(req.query, schema.paths['/users/login'].post.parameters)
        .then(query => {
            let username = '', email = '';
            let password = query.password;

            // check these parameters manually as swagger doesn't allow for oneOf type semantics so email and username are given as optional
            if (query.hasOwnProperty('username')) username = query.username;
            if (query.hasOwnProperty('email')) email = query.email;

            users.authenticate(username, email, password, (err, id) => {
                if (err)
                    res.status(400).send('Invalid username/email/password supplied');
                else
                    users.getToken(id, (err, token) => {
                        /// return existing token if already set (don't modify tokens)
                        if (token) return res.status(200).json({id: id, token: token});
                        // but if not, complete login by creating a token for the user
                        users.setToken(id, (err, token) => {
                            res.status(200).json({id: id, token: token})
                        });
                    })
            })
        })
        .catch(() => res.sendStatus(400))
};

/**
 * logout the user identified by the provided auth token
 * (prior auth required)
 */
const logout = (req, res) => {
    let token = req.get(config.get('authToken'));
    users.removeToken(token, err => {
        if (err)
            return res.sendStatus(401);
        return res.sendStatus(200);
    });
    return null;
};

module.exports = {
    create: create,
    read: read,
    update: update,
    remove: remove,
    login: login,
    logout: logout
};