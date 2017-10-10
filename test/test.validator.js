"use strict";

/**
 * tests for body and parameter validation
 *
 * clearly just a skeleton for now. Because we rely on zschema and swagger-parameters for validation, the most
 * import thing is to check that they are using the right sections of the schema when validating.
 */

const
    chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    schema = require('../config/swagger-api-v2.1.6.json'),
    validator = require('../app/lib/validator');


describe('given a request body', function() {

    describe('given an invalid body', function() {
        it('should fail validation', function (done) {
            validator.isValidSchema({id: "toki"}, 'definitions.ProjectsOverview').should.be.false;
            done();
        });
    });

    describe('given an valid body', function() {
        it('should pass validation', function (done) {
            validator.isValidSchema({username:"toki", email:"toki@valhalla.biz", password:"toki"}, 'definitions.User').should.be.true;
            done();
        });
    });

    describe('given a body with extra element', function() {
        it('should fail validation', function(done) {
            validator.isValidSchema({username:"toki", extra:true, email:"toki@valhalla.biz", password:"toki"}, 'definitions.User').should.be.false;
            done();
        })
    });

    describe('given "creator" parameter less than minimum', function() {
        it('should fail validation', function () {
            return validator.areValidParameters({creator: -1}, schema.paths['/projects'].get.parameters)
                     .then(() => Promise.reject)
                     .catch(() => Promise.resolve)
            });

    });

    describe('given "open" parameter not a boolean', function() {
        it('should fail validation', function () {
            return validator.areValidParameters({open: -1}, schema.paths['/projects'].get.parameters)
                     .then(() => Promise.reject)
                     .catch(() => Promise.resolve)
        });

    });

    describe('given "open" parameter as a boolean', function() {
        it('should pass validation', function () {
            return validator.areValidParameters({open: true}, schema.paths['/projects'].get.parameters)
                .then(parsedQuery => parsedQuery.open.should.be.a('boolean'))
        });
    });

    describe('given "count" parameter as an string', function() {
        it('should convert to numeric', function () {
            return validator.areValidParameters({count: '1'}, schema.paths['/projects'].get.parameters)
                            .then(parsedQuery => {
                                parsedQuery.count.should.be.a('number');
                                parsedQuery.count.should.not.be.a('string')
                            })
        });
    });

    describe('given additional parameter', function() {
        it('should fail validation', function() {
            return validator.areValidParameters({loki: true}, schema.paths['/projects'].get.parameters)
                     .then(() => Promise.reject)
                     .catch(() => Promise.resolve)
        });
    });

});
