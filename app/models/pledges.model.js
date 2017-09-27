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
        'SELECT * from pledges WHERE projectid=? ORDER BY ts DESC',
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
        'SELECT SUM(amount) AS total, anonymous, COUNT(DISTINCT userid) AS backers from pledges WHERE projectid=? GROUP BY anonymous',
        projectId,
        (err, results) => {
            if (err) return done(err);
            if (results.length === 0) return done(err, null);
            // now aggregate separate totals for anonymous and non-anonymous backers
            let totals = {};
            totals.currentPledged = results.reduce((acc, cur) => acc + cur.total, 0);  // aggregate anonymous and non-anonymous totals
            totals.numberOfBackers = results.map(result => result.anonymous ? 1 : result.backers).reduce((acc, cur) => acc + cur, 0);  // group all anonymous backers
            done(err, totals)
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