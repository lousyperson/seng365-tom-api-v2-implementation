"use strict";

/**
 * pledges
 *
 * by using ? placeholders in mysql module queries, all are automatically escaped against injection attacks (https://www.npmjs.com/package/mysql#preparing-queries)
 */

const
    db = require('../lib/db.js');

/**
 * return array of pledges for this project (empty array if no pledges)
 *
 * @param projectId
 * @param done
 */
const get = (projectId, done) => {
    db.get().query(
        'SELECT * from pledges WHERE projectid=?',
        projectId,
        (err, pledges) => done(err, pledges))
};

/**
 * return total pledged and number of unique userIds for backers for a project (null if no pledges)
 *
 * @param projectId
 * @param done
 */
const getTotals = (projectId, done) => {
    db.get().query(
        'SELECT SUM(amount) AS total, COUNT(DISTINCT userid) AS backers from pledges WHERE projectid=?',
        projectId,
        (err, totals) => {
            if (err) return done(err);
            if (totals.length === 0) return done(err, null);
            if (totals[0].backers === 0) totals[0].total = 0;
            done(err, totals[0])
        }
    );
};

/**
 * add a new pledge to the project
 *
 * @param projectId
 * @param pledge
 * @param done
 * @returns {*}
 */
const insert = (projectId, pledge, done) => {
    let amount = parseInt(pledge.amount);
    if (!Number.isInteger(amount)) return done('amount is not integer');

    db.get().query( // use VALUES form rather than SET as project parameter includes extra fields
        'INSERT INTO pledges (projectid, userid, amount, anonymous, cardToken) VALUES (?, ?, ?, ?, ?)',
        [projectId, pledge.id,amount, pledge.anonymous, pledge.card.authToken],
        (err, results) => {
            if (err) return done(err);
            done(err, results.insertId)
        }
    );
};

module.exports = {
    get: get,
    getTotals: getTotals,
    insert: insert
};