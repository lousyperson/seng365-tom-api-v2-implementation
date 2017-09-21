"use strict";

/**
 * incomplete test suite for model methods.
 * currently just tests some of the more critical ones.
 *
 * assumes that a db is up and running according to the config
 *
 * TODO: add more unit tests
 * TODO: separate out into a file for each model
 */

const
    log = require('../app/lib/logger')({name: __filename, level: 'debug'}),
    chai = require('chai'),
    should = chai.should(),
    config = require('../config/config.js'),
    projects = require('../app/models/projects.model'),
    users = require('../app/models/users.model'),
    rewards = require('../app/models/rewards.model'),
    images = require('../app/models/images.model'),
    pledges = require('../app/models/pledges.model'),
    db = require('../app/lib/db'),
    initDb = require('../app/lib/db.init'),
    validator = require('../app/lib/validator'),
    apiSchema = require('../config/api.schema');

const userTemplate = (username, email, password) => {
    return {
        user: {
            id: 0,
            username: username,
            location: "Valhalla",
            email: email
        },
        password: password
    };
};

const projectTemplate = (creator, id) => {
    return {
        title: "My awesome project",
        subtitle: "More awesomeness",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        imageUri: "/projects/0/image",
        target: 123400,
        creators: [
            {
                id: id,
                name: creator
            }
        ],
        rewards: rewardsTemplate()
    };
};

const pledgeTemplate = (id=1, anonymous=false, amount=500) => {
    return {
        id: id,
        amount: amount,
        anonymous: anonymous,
        card: {
            authToken: '7383134dfd2665961c326579c5dc22d1'
        }
    }
};

const rewardsTemplate = () => {
    return [
        {
            id: 0,
            amount: 500,
            description: "Cheap and cheerful"
        },
        {
            id: 1,
            amount: 1000,
            description: "For the discerning"
        }
    ]
};


const createUser = user => {
    return new Promise((resolve, reject) => {
        users.insert(user, (err, userId) => {
            if (err) return reject(err);
            return resolve(err, userId)
        })
    })
};

const createProject = project => {
}
}



describe('given a clean db', function() {

    let userId;

    beforeEach(`clean db`, function() {
        this.timeout(5000);
        return initDb(config.get('db'))
            .catch(err => {
                console.log(err);
                process.exit(1);
            })
    });

    beforeEach(`Establish connection`, function(done) {
        db.connect(config.get('db'), err => {
            if (err) return done(err);
            return done();
        })
    });

    beforeEach(`create user to prevent foreign key issues`, function(done) {
        users.insert({username: 'loki', email:'loki@valhalla.biz', password:'toki'}, (err, result) => {
            if (err) return done(err);
            userId = result;
            return done(err, result)
        })
    });

    afterEach('close connection', function(done) {
        db.end(done);
    });

    describe('With a single user', function(done) {

        it('insert project', function (done) {
            let project = projectTemplate('loki', userId);
            projects.insert(project, (err, results) => {
                should.equal(err, null);
                results.should.equal(1);
                return done()
            })
        });

        it('delete user and check auth', function (done) {
            users.authenticate('loki', 'toki', result => {
                result.should.be.true;
                users.remove(userId, (err, results) => {
                    users.authenticate('loki', 'toki', result => {
                        result.should.be.false;
                        return done();
                    })
                })
            })
        });

        it('delete user and check idFromToken', function (done) {
            users.authenticate('loki', 'toki', result => {
                result.should.be.true;
                users.remove(userId, (err, results) => {
                    users.authenticate('loki', 'toki', result => {
                        result.should.be.false;
                        return done();
                    })
                })
            })
        });

        it('delete user and check not shown', function (done) {
            users.remove(userId, () => {
                users.getOne(userId, true, (err, user) => {  // only active users
                    should.equal(user, null);
                    users.getOne(userId, false, (err, user) => {  // include deleted users
                        user.id.should.equal(userId);
                        return done();
                    })
                })
            })
        });

    });

    describe('With a user and a project', function(done) {

        let projectId;

        beforeEach('Create project', function(done) {
            let project = projectTemplate('loki', userId);
            projects.insert(project, (err, _projectId) => {
                projectId = _projectId;
                return done()
            })
        });

        it('get project', function (done) {
            projects.getOne(projectId, (err, project) => {
                should.equal(err, null);
                validator.isValidSchema(project, 'definitions.ProjectDetails');
                return done();
            })
        });

        it('get undefined project', function (done) {
            projects.getOne(123, (err, results) => {
                should.equal(err, null);
                should.equal(results, null);
                return done();
            })
        });

        it('update rewards', function(done) {
            rewards.update(projectId, rewardsTemplate(), err => {
                should.equal(err, null);
                return done();
            })
        });

        it('make pledge', function(done) {
            pledges.insert(projectId, pledgeTemplate(), (err, id) => {
                should.equal(err, null);
                Number.isInteger(id).should.be.true;
                return done();
            })
        });

        it('get anonymous pledges', function(done) {
            pledges.insert(projectId, pledgeTemplate(1, true), (err, id) => {
                projects.getOne(projectId, (err, project) => {
                    should.equal(err, null);
                    validator.isValidSchema(project, 'definitions.ProjectDetails').should.be.true;
                    project.backers[0].username.should.equal("anonymous");
                    return done();
                })
            })
        });

        it('get undefined image', function (done) {
            images.get(123, (err, results) => {
                should.equal(results, null);
                return done()
            })
        });

        it('put status change', function (done) {
            projects.update(projectId, false, err => {
                should.equal(err, null);
                // TODO: check that status has changed to closed
                return done();
            })
        })

    });

    describe('With a user and two projects', function(done) {

        let project1Id, project2Id;

        beforeEach('Create project', function(done) {
            let project = projectTemplate('loki', userId);
            project = Object.assign(project, {title: "Project1"});
            projects.insert(project, (err, _projectId) => {
                setTimeout(() => {
                    project1Id = _projectId;
                    project = Object.assign(project, {title: "Project2"});
                    projects.insert(project, (err, _projectId) => {
                        project2Id = _projectId;
                        users.insert({username: 'loki', email:'loki@valhalla.biz', password:'toki'}, (err, result) => {
                            if (err) return done(err);
                            userId = result;
                            return done(err, result)
                        })
                    })
                }, 1000)

            })
        });

        it('get projects', function (done) {
            projects.getAll({limit:10}, (err, results) => {
                should.equal(err, null);
                results.should.have.lengthOf(2);
                validator.isValidSchema(results, 'definitions.ProjectsOverview').should.be.true;
                return done();
            })
        });

        it('get projects with offset 1', function (done) {
            projects.getAll({limit:10, offset:1}, (err, results) => {
                should.equal(err, null);
                results.should.have.lengthOf(1);
                validator.isValidSchema(results, 'definitions.ProjectsOverview').should.be.true;
                results[0].title.should.equal('Project1'); // ordered from most recent to least recent
                return done();
            })
        });

        it('get projects with limit 1', function (done) {
            projects.getAll({limit:1}, (err, results) => {
                should.equal(err, null);
                results.should.have.lengthOf(1);
                validator.isValidSchema(results, 'definitions.ProjectsOverview').should.be.true;
                results[0].title.should.equal('Project2'); // ordered from most recent to least recent
                return done();
            })
        });

        it('get projects with open=true', function (done) {
            projects.getAll({open:true}, (err, results) => {
                should.equal(err, null);
                results.should.have.lengthOf(1);
                validator.isValidSchema(results, 'definitions.ProjectsOverview').should.be.true;
                return done();
            })
        });

        it('check totals', function (done) {
            pledges.insert(project1Id, pledgeTemplate(userId, false, 250), (err, id) => {
                pledges.getTotals(project1Id, (err, totals) => {
                    should.not.equal(totals, null);
                    totals.total.should.equal(250);
                    totals.backers.should.equal(1);
                    return done();
                })
            })
        });

    });

    describe('With a two users each with one project, each pledging to the other project', function(done) {

        let project1Id, project2Id;

        beforeEach('Create project', function(done) {
            let project = projectTemplate('loki', userId);
            project = Object.assign(project, {title: "Project1"});
            projects.insert(project, (err, _projectId) => {
                setTimeout(() => {
                    project1Id = _projectId;
                    project = Object.assign(project, {title: "Project2"});
                    projects.insert(project, (err, _projectId) => {
                        project2Id = _projectId;
                        return done()
                    })
                }, 1000)

            })
        });

    it('get projects with creator=loki', function (done) {
        projects.getAll({creator:userId}, (err, results) => {
            should.equal(err, null);
            results.should.have.lengthOf(2);
            validator.isValidSchema(results, 'definitions.ProjectsOverview').should.be.true;
            return done();
        })
    });

    it('get projects with creator=0', function (done) {
        projects.getAll({creator:true}, (err, results) => {
            should.equal(err, null);
            results.should.have.lengthOf(2);
            validator.isValidSchema(results, 'definitions.ProjectsOverview').should.be.true;
            return done();
        })
    });

});