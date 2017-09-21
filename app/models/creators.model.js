"use strict";

/**
 * creators
 *
 * by using ? placeholders in mysql module queries, all are automatically escaped against injection attacks (https://www.npmjs.com/package/mysql#preparing-queries)
 */

const
    db = require('../lib/db.js');
/**
 * return the creators for the project, as a list of userIds (should always have length>0)
 *
 * @param projectId
 * @param done
 */
const get = (projectId, done) => {
    db.get().query(
        'SELECT userid from creators WHERE projectid=?',
        projectId,
        (err, results) => done(err, results.map(result=>result.userid)) // assumes that projects always have creators
    );
};

/**
 * add a list of creators to a project
 *
 * @param projectId
 * @param creators  as an array of userIds
 * @param done
 */
const insert = (projectId, creators, done) => {
    let values = creators.map(creator => [projectId, creator.id]);
    db.get().query(
        'INSERT INTO creators (projectid, userid) VALUES ?',
        [values],
        (err, results) => {
            if (err) return done(err);
            else
                return done(err, results.insertId)
        }
    )
};

/**
 * remove all creators for the given projectId
 *
 * @param projectId
 * @param done
 */
const remove = (projectId, done) => {
    db.get().query(
        'DELETE FROM creators WHERE projectid=?',
        [id],
        (err, results) => done(err)
    )
};

module.exports = {
    get: get,
    insert: insert,
    remove: remove
};