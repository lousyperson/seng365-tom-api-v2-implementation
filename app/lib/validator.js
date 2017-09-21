"use strict";

/**
 * validation functions for checking parameters and schemas
 *
 * the heavy lifting is mostly done by ZSchema
 */

const
    ZSchema = require('z-schema'),
    schema = require('../../config/api.schema'),
    options = {}, // no specific options for ZSchema...
    validator = new ZSchema(options);

/**
 * validate :id parameters
 * we make no assumptions about the type of the provided :id, but check that valid == an integer > 0
 *
 * @param id    of any Type
 * @returns {boolean}
 */
const validateId = id => {
    let _id = parseInt(id); // force to integer returns NaN if not
    return Number.isInteger(_id) && (_id > 0) // big fat assumption that ids start at 1, not 0 (ok for standard mysql autoincrements)
};

/**
 * validate some object against the API schema
 *
 * @param actual        the object to be validated (usually a req.body)
 * @param schemaPath    if supplied, sub-schema to be used for validation (passed directly to ZSchema schemaPath)
 */
const validateSchema = (actual, schemaPath = 'definitions') => {
    return validator.validate(actual, schema,  {schemaPath: schemaPath })
}

const getLastErrors = () => validator.getLastErrors();

module.exports = {
    isValidSchema: validateSchema,
    getLastErrors: getLastErrors,
    isValidId: validateId
};
