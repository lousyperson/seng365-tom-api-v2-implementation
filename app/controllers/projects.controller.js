"use strict";

/**
 * controller methods for the /projects endpoints
 */

const
    log = require('../lib/logger')(),
    projects = require('../models/projects.model'),
    rewards = require('../models/rewards.model'),
    images = require('../models/images.model'),
    pledges = require('../models/pledges.model'),
    validator = require('../lib/validator');


/**
 * list all projects, filtering by req.query parameters
 */
const list = (req, res) => {
    validator.areValidParameters(req.query)
        .then(options => {
            projects.getAll(options, (err, projects) => {
                // validate response
                if (projects.length > 0) {
                    if (!validator.isValidSchema(projects, 'definitions.ProjectsOverview')) {
                        log.warn(JSON.stringify(projects, null, 2));
                        log.warn(validator.getLastErrors());
                        return res.sendStatus(500);
                    }
                }
                return res.status(200).json(projects);
            })
        })
        .catch(() => res.status(400))
};

/**
 * get details for a single project
 */
const read = (req, res) => {
    let projectId = parseInt(req.params.id);
    if (!validator.isValidId(projectId)) return res.sendStatus(404);

    projects.getOne(projectId, (err, project) => {
        if (err) {
            log.warn(err);
            return res.sendStatus(500);
        }
        if (project === null)
            return res.sendStatus(404);
        if (!validator.isValidSchema(project, 'definitions.ProjectDetails')) {
            log.warn(JSON.stringify(project, null, 2));
            log.warn(validator.getLastErrors());
            return res.sendStatus(500);
        }
        return res.status(200).json(project);
    })
};

/**
 * create a new project
 */
const create = (req, res) => {
    if (!validator.isValidSchema(req.body, 'definitions.ProjectCreation')) {
        log.warn(`projects.controller.create: bad project ${JSON.stringify(req.body)}`);
        return res.sendStatus(400);
    }
    else {
        let project = Object.assign({}, req.body); // be overly protective of req.body...
        projects.insert(project, (err, id) => {
            if (err)
                return res.sendStatus(500);
            return res.status(201).json({id:id});
        })
    }
};

/**
 * change project status between open and closed
 */
const update = (req, res) => {
    let projectId = parseInt(req.params.id);
    if (!validator.isValidId(projectId)) return res.sendStatus(404);

    if (!validator.isValidSchema(req.body, 'definitions.Status')) {
        log.warn(`projects.controller.update: bad change of project status ${JSON.stringify(req.body)}`);
        return res.sendStatus(400);
    }
    else {
        projects.isOpen(projectId, (err, open) => {
            if (err) return res.sendStatus(500);
            if (!open) return res.sendStatus(403);
            projects.update(projectId, req.body.open, err => {
                if (err) return res.sendStatus(404);
                return res.sendStatus(201)
            })
        })
    }
};

/**
 * return the image associated with the project
 */
const readImage = (req, res) => {
    let projectId = parseInt(req.params.id);
    if (!validator.isValidId(projectId)) return res.sendStatus(404);

    images.get(projectId, (err, results) => {
        if (err || ! results) {
            log.warn(err, results);
            return res.sendStatus(404);
        }
        else {
            let image = results.image;
            let type = results.type;
            return res.status(200).set({'Content-Type': type, 'Content-Length': image.length}).send(image);
        }
    })
};

/**
 * set the image associated with the project, replacing any earlier image
 */
const updateImage = (req, res) => {
    let projectId = parseInt(req.params.id);
    if (!validator.isValidId(projectId)) return res.sendStatus(404);

    // only accept PNG and JPEG
    let contentType = req.get('Content-Type');
    if (contentType!=='image/png' && contentType !== 'image/jpeg' ) return res.sendStatus(400);

    images.update(projectId, {image: req.body, type: contentType}, err => {
        if (err) return res.sendStatus(404);
        return res.sendStatus(201);
    })
};

/**
 * return all rewards for the project
 */
const readRewards = (req, res) => {
    let projectId = parseInt(req.params.id);
    if (!validator.isValidId(projectId)) return res.sendStatus(404);

    rewards.get(projectId, (err, rewards) => {
        if (err)
            return res.sendStatus(404);
        if (!validator.isValidSchema(rewards, 'definitions.Rewards'))
            return res.sendStatus(500);
        return res.status(200).json(rewards)
    })
};

/**
 * replace the rewards for the projects with a new set
 */
const updateRewards = (req, res) => {
    let projectId = parseInt(req.params.id);
    if (!validator.isValidId(projectId)) return res.sendStatus(404);

    if (!validator.isValidSchema(req.body, 'definitions.RewardsCreation')) {
        log.warn(`projects.controller.updateRewards: bad rewards ${JSON.stringify(req.body)}`);
        log.warn(validator.getLastErrors());
        return res.sendStatus(400);
    }
    else {
        rewards.update(projectId, req.body, err => {
            if (err)
                return res.sendStatus(500);
            return res.sendStatus(201);
        })
    }
};

/**
 * receive a pledge to the project
 * assumes that project is open to pledges (enforced in route)
 *
 * TODO: post-condition to check that the pledge amount is reflected in the project totals
 */
const addPledge = (req, res) => {
    let projectId = parseInt(req.params.id);
    if (!validator.isValidId(projectId)) return res.sendStatus(404);

    if (!validator.isValidSchema(req.body, 'definitions.Pledge')) {
        log.warn(`projects.controller.addPledge: bad pledge ${JSON.stringify(req.body)}`);
        log.warn(validator.getLastErrors());
        return res.sendStatus(400);
    }
    else {
        let pledge = Object.assign({}, req.body);
        pledges.insert(projectId, pledge, (err, id) => {
            if (err)
                return res.sendStatus(500);
            return res.status(201).json({id:id});
        })
    }
};

module.exports = {
    list: list,
    read: read,
    create: create,
    update: update,
    readImage: readImage,
    updateImage: updateImage,
    readRewards: readRewards,
    updateRewards: updateRewards,
    addPledge: addPledge
};
