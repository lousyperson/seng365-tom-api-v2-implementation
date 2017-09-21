"use strict";

const db = require('../lib/db');

/**
 * run a function with parameters as a single database transaction
 * @param fn
 * @param params
 * @param done
 */
module.exports = (fn, params, done) => {
    db.get().getConnection((err, connection) => (
        connection.beginTransaction(() => {
            // try the sql operations
            fn(params, (err, result) => {
                if (err) {
                    connection.rollback();
                    connection.release();
                    return done(err);
                }
                // no error from sql operations, so attempt to commit
                connection.commit(err => {
                    if (err) {
                        connection.rollback();
                        connection.release();
                        return done(err);
                    }
                    connection.release();
                    return done(err, result)
                });

            })
        })
    ))
};