"use strict";

/**
 * rewards
 *
 * by using ? placeholders in mysql module queries, all are automatically escaped against injection attacks (https://www.npmjs.com/package/mysql#preparing-queries)
 */

const
    db = require('../lib/db.js'),
    asTransaction = require('./transaction');

/**
 * return array of rewards for projectId (empty array if no rewards)
 *
 * @param projectId
 * @param done
 */
const get = (projectId, done) => {
    db.get().query(
        'SELECT id, amount, description from rewards WHERE projectId=?',
        projectId,
        (err, rewards) => done(err, rewards)
    );
};

/**
 * insert a set of rewards into the rewards table
 *
 * @param projectId
 * @param rewards   an array of [id, amount, description] (one for each reward)
 * @param done
 */
const insert = (projectId, rewards, done) => {
    let preparedRewards = rewards.map(reward => [projectId, reward.amount, reward.description]);
    db.get().query(
        'INSERT into rewards (projectId, amount, description) VALUES ?',
        [preparedRewards],  // assumes a nested array with each subarray containing [projectId, amount, description]
        (err, results) => done(err, results)
    );
};

/**
 * update rewards
 *
 * implemented as an atomic transaction that first removes all rewards for the project and then
 * inserts the new set
 *
 * @param projectId
 * @param rewards
 * @param done
 */
const update = (projectId, rewards, done) => {
    let atomic = (data, next) => {
        remove(data.projectId, err => {
            if (err) next(err);
            insert(data.projectId, data.rewards, err => {
                next(err);
            })
        })
    };
    asTransaction(atomic, {projectId:projectId, rewards:rewards}, err => {return done(err)});
};

/**
 * remove rewards from a project
 *
 * @type {function(*=, *)}
 */
const remove = (projectId, done) => {
    db.get().query(
        'DELETE FROM rewards WHERE projectId=?',
        projectId,
        (err, results) => done(err, results)
    )
};

module.exports = {
    get: get,
    insert: insert,
    update: update,
    remove: remove
};