"use strict";

/**
 * projects
 *
 * by using ? placeholders in mysql module queries, all are automatically escaped against injection attacks (https://www.npmjs.com/package/mysql#preparing-queries)
 */

const
    log = require('../lib/logger')({name: __filename, level: 'warn'}),
    db = require('../lib/db.js'),
    creatorsModel = require('./creators.model'),
    rewardsModel = require('./rewards.model'),
    pledgesModel = require('./pledges.model'),
    usersModel = require('./users.model'),
    imagesModel = require('./images.model'),
    asTransaction = require('./transaction'),
    each = require('async-each'); // lighter-weight than the full `async` module


/**
 * return all projects between `limit` and `limit+offset` when ordered by creation timestamp
 *
 * @param options   assume these have been validated upstream
 * @param done
 */
const getAll = (options, done) => {

    let whereConditions = [],
        joinTables = '',
        joinCondition = '',
        whereCondition = '',
        tableSources = {'creator':'creators', 'backer': 'pledges'};

    // set default options where defaults apply - other options are either filter-or-not
    if (!options.hasOwnProperty('count')) options.count=10000;
    if (!options.hasOwnProperty('startIndex')) options.startIndex=0;

    // construct SQL for option open
    if (options.hasOwnProperty('open')) whereConditions.push(`pr.open=${options['open']}`)

    // construct SQL for JOINs for options for creator and backer
    let parameterKeys = Object.keys(options).filter(option => Object.keys(tableSources).includes(option));
    if (parameterKeys.length > 0) {
        let tables = parameterKeys.map(option => tableSources[option]);
        joinTables = ' JOIN (' + tables.join(', ') + ')';
        joinCondition = ' ON ' + tables.map(table => `pr.id=${table}.projectid`).join(' AND ');
        whereConditions = whereConditions.concat(parameterKeys.map(option => `${tableSources[option]}.userid=${options[option]}`));
    }

    // construct SQL for combined WHERE condition
    if (whereConditions.length > 0) whereCondition = ' WHERE ' + whereConditions.join(' AND ');

    // finalise SQL
    let sql = `SELECT pr.id, pr.title, pr.subtitle, pr.open, exists(select 1 from images where images.projectid=2) as hasImage
     FROM projects pr ${joinTables}${joinCondition}${whereCondition}
     ORDER BY pr.ts DESC LIMIT ? OFFSET ?`;
    log.debug(sql, [options.count, options.startIndex]);

    db.get().query(sql,
        [options.count, options.startIndex],
        (err, projects) => {
            if (err) return done(err);
            if (!projects) return done(err, null);

            // if image exists, then set imageUri correctly
            projects.map(project => {
                if (project.hasImage) project.imageUri = `/projects/${project.id}/image`;
                delete project.hasImage;
                return project
            });
            projects.map(project => project.open = Boolean(project.open)); // munge mysql int boolean to proper boolean
            return done(err, projects)
        }
    )
};

/**
 * get a single project, formatted according to the ProjectData schema
 *
 * using Promise.all to combine the subelements, but could equally use a chain of `thens` (although that would be sequential)
 * or `await` or even one of the async module methods.
 *
 * @param projectId
 * @param done
 */
const getOne = (projectId, done) => {

    let _getProject = projectId => {
        return new Promise((resolve, reject) => {
            db.get().query(
                'SELECT title, subtitle, description, target, open, ' +
                'unix_timestamp(ts)*1000 as creationDate, ' +
                'exists(select 1 from images where images.projectid=2) as hasImage ' +
                'from projects WHERE id=?',
                projectId,
                (err, projects) => {
                    if (err) return reject(err);
                    if (projects.length === 0) return resolve(null);
                    projects[0].open = Boolean(projects[0].open);  // munge mysql int boolean to proper boolean
                    resolve(projects[0])
                }
            )
        })
    };

    let _getCreators = projectId => {
        return new Promise((resolve, reject) => {
            creatorsModel.get(projectId, (err, creatorIds) => {
                if (err) return reject(err);
                // aynchronously map ids to users - include any deleted users as they are still creators
                each(creatorIds, (id, callback) => usersModel.getOne(id, true, callback), (err, creators) => {
                    if (err) return reject(err);
                    // extract the fields needed for the creators section of the schema
                    resolve(creators.map(creator => {return {id: creator.id, username: creator.username}}));
                })
            })
        })
    };

    let _getRewards = projectId => {
        return new Promise((resolve, reject) => {
            rewardsModel.get(projectId, (err, rewards) => {
                if (err) return reject(err);
                resolve(rewards);
            })
        })
    };

    let _getProgress = projectId => {
        return new Promise((resolve, reject) => {
            pledgesModel.getTotals(projectId, (err, totals) => {
                if (err) return reject(err);
                if (!totals) return resolve(null);
                resolve({currentPledged: totals.currentPledged, numberOfBackers: totals.numberOfBackers})
            })
        })

    };

    let _getBackers = projectId => {
        return new Promise((resolve, reject) => {
            pledgesModel.get(projectId, (err, backers) => {
                if (err) return reject(err);
                each(backers,
                    (backer, callback) => {
                        // don't include deleted users in backers
                        usersModel.getOne(backer.userid, false, (err, user) => {
                            let username = backer.anonymous ? 'anonymous' : user.username;
                            callback(err, {id: user.id, username: username, amount: backer.amount})
                        })
                    },
                    (err, backers) => {
                        if (err) return reject(err);
                        resolve(backers); // will resolve as null if no backers
                    })
            })
        })
    };

    // get all components of the ProjectDetails with Promise.all, and combine into the response
    // if project not found, return null

   Promise.all([_getProject(projectId), _getCreators(projectId), _getRewards(projectId), _getProgress(projectId), _getBackers(projectId)])
        .then(results => {

            if (results[0] === null) return done(null, null);
            let projectDetails = results[0]; // title, subtitle, description, target, open, and creationDate
            projectDetails.id = projectId;
            projectDetails.creators = results[1];
            projectDetails.rewards = results[2];
            // optional elements
            if (results[3]) projectDetails.progress = results[3];
            if (results[4]) projectDetails.backers = results[4];

            if (projectDetails.hasImage) projectDetails.imageUri = `/projects/${projectId}/image`;
            delete projectDetails.hasImage;

            return done(null, projectDetails)
        })
        .catch(err => {
            log.fatal(`could not get project ${projectId}`);
            return done(err, null);
        })
};

let _insert = (project, done) => {
    db.get().query( // use VALUES rather than SET as project parameter includes extra fields
        'INSERT INTO projects (title, subtitle, description, target) VALUES (?, ?, ?, ?)',
        [project.title, project.subtitle, project.description, project.target],
        (err, results) => {
            if (err) return done(err);
            else
                return done(err, results.insertId)
        }
    )
};

/**
 * add a new project. All work is done by internal methods of other models, wrapped in a db transaction so atomic
 *
 * @param project matching the ProjectData schema
 * @param done
 */
const insert = (project, done) => {
    let atomic = (project, next) => {
        _insert(project, (err, projectId) => {
            if (err) return next(err);
            creatorsModel.insert(projectId, project.creators, err => {
                if (err) return next(err);
                rewardsModel.insert(projectId, project.rewards, err => {
                    return next(err, projectId);
                })
            })
        }
    )};
    asTransaction(atomic, project, (err, projectId) => {return done(err, projectId)});
};

/**
 * change the pledge status of a project
 *
 * @param projectId
 * @param status    boolean, true is open and false is closed to pledges
 * @param done
 */
const update = (projectId, status, done) => {
    db.get().query(
        'UPDATE projects SET open=? WHERE id=?',
        [status, projectId],
        err => {return done(err)}
    )
};

/**
 * check if a project is open to pledges
 *
 * @param projectId
 * @param done
 */
const isOpen = (projectId, done) => {
    db.get().query(
        'SELECT EXISTS (SELECT 1 FROM projects WHERE id=? AND open=TRUE)',
        projectId,
        (err, results, fields) => {
            let open = results[0][fields[0].name]; // because RowDataPacket returned by select exists has query as key
            done(err, open)
        }
    )
};

module.exports = {
    getAll: getAll,
    getOne: getOne,
    insert: insert,
    update: update,
    isOpen: isOpen
};
