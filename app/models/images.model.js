"use strict";

/**
 * images
 *
 * by using ? placeholders in mysql module queries, all are automatically escaped against injection attacks (https://www.npmjs.com/package/mysql#preparing-queries)
 */

const
    db = require('../lib/db.js');


/**
 * return image blob for projectId (null if the project lacks an image)
 *
 * @param projectId
 * @param done
 */
const get = (projectId, done) => {
    db.get().query(
        'SELECT type, image from images WHERE projectId=?',
        projectId,
        (err, images) => done(err, images.length>0 ? images[0] : null)
    );
};

const update = (projectId, image, done) => {
    db.get().query(
        'INSERT INTO images (projectId, image, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE image=?, type=?',
        [projectId, image.image, image.type, image.image, image.type],
        (err, results) => done(err, results)
    );
};

module.exports = {
    get: get,
    update: update
};