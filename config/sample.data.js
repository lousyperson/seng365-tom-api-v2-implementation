'use strict';

/**
 * create a set of sample data from project metadata in json, and images as jpg, all found in `sampleDataDirectory`
 * project metadata should be an array of {projectTemplate: <ProjectCreation schema>, imageFileName: <filename>}
 *
 * sample data is creating using model methods. This is one level up from direct db access (either by SQL or through
 * a db dump) and so it is db schema-independent, while it's one level down from using the API itself, which would be much
 * slower.
 */

const
    log = require('../app/lib/logger')(),
    path = require('path'),
    fs = require('fs'),
    db = require('../app/lib/db'),
    images = require('../app/models/images.model'),
    users = require('../app/models/users.model'),
    projects = require('../app/models/projects.model');

const
    sampleDataDirectory = './config/sample.data';

let userIds = [];

/**
 * method lifted from MDN for generating random integers in some range
 *
 * @param min
 * @param max
 * @returns {*}
 */
const getRandomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

/**
 * add a an image to a pre-existing project
 * TODO: consolidate with methods in test directory
 *
 * @param projectId
 * @param image
 * @returns {Promise}
 */
const addImage = (projectId, image) => {
    log.info(`adding image ${image} to ${projectId}`);
    return new Promise((resolve, reject) => {
        let imageData = fs.readFileSync(path.join(sampleDataDirectory, image));
        // imageType is MIME type e.g., image/png or image/jpeg
        let fileExtension = path.extname(image).slice(1);  // remove initial '.'
        if (fileExtension==='jpg') fileExtension = 'jpeg'; // hacky munge to MIME from file extension
        images.update(projectId, {image:imageData, type:`image/${fileExtension}`}, err => {
            if (err) return reject(err);
            return resolve();
        });

    })
};

/**
 * add a user
 * TODO: consolidate with methods in test directory
 *
 * @param user
 * @returns {Promise}
 */
const createUser = user => {
    log.info(`creating user ${JSON.stringify(user)}`);
    return new Promise((resolve, reject) => {
        users.insert(user, (err, userId) => {
            if (err) return reject(err);
            return resolve(userId);
        })
    })
};

/**
 * add a project, given a pre-existing user for a creator
 * TODO: consolidate with methods in test directory
 *
 * @param project
 * @returns {Promise}
 */
const createProject = project => {
    log.info(`creating project ${JSON.stringify(project)}`);
    return new Promise((resolve, reject) => {
        projects.insert(project, (err, projectId) => {
            if (err) return reject(err);
            return resolve(projectId);
        })
    })
};

let userData = [
    {
        username: 'loki',
        email:'loki@valhalla.biz',
        password:'toki'
    }
];

let projectData = [
    {
        image: '640px-Bay_of_Noboto.jpg',
        project: {
            title: 'Bay of Noboto',
            subtitle: 'A print by Katsushika Hokusai',
            description: 'From the series Thirty-Six Views of Mount Fuji',
            creators: [
                {
                    id: 1,
                    name: 'loki'
                }
            ],
            target: getRandomIntInclusive(5000, 10000)
        }
    },
    {
        image: '640px-Great_Wave_off_Kanagawa2.jpg',
        project: {
            title: 'Great Wave off Kanagawa',
            subtitle: 'A print by Katsushika Hokusai',
            description: 'From the series Thirty-Six Views of Mount Fuji',
            creators: [
                {
                    id: 1,
                    name: 'loki'
                }
            ],
            target: getRandomIntInclusive(5000, 10000)
        }
    }];

/**
 * insert sample data into the db. Construct a promise chain to do the work in an ordered way (users first, then projects and images)
 *
 * @param config
 * @returns {Promise}
 */
module.exports = (config) => {
    return new Promise((resolve, reject) => {
        db.connect(config.get('db'), err => {
            if (err) return reject(err);
            let p = Promise.resolve();

            // only add sample data if requested to do so

            if (config.get('sampledata')) {
                log.info('creating sample data');
                for(let user of userData) {
                    p = p.then(()=>createUser(user)).then(userId => userIds.push(userId));
                }
                for(let project of projectData) {
                    p = p.then(() => createProject(project.project)).then(projectId => addImage(projectId, project.image));
                }
            }
            return resolve(p);
        })
    })
};