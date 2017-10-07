'use strict';

const
    convict = require('convict'),
    path = require('path');

let
    config = convict({
        env: {
            format: ['production', 'development'],
            default: 'development',
            arg: 'env',
            env: 'NODE_ENV'
        },
        log: {
            level: {
                format: String,
                default: 'debug',
                arg: 'log-level',
                env: 'LOG_LEVEL'
            }
        },
        port: {
            format: 'port',
            default: 4941,
            arg: 'port',
            env: 'SENG365_PORT'
        },
        basepath: {
            format: String,
            default: '/api/v2',
            arg: 'basepath',
            env: 'SENG365_BASEPATH'
        },
        authToken: {
            format: String,
            default: 'X-Authorization'
        },
        cleanstart: {
            format: 'Boolean',
            default: true,
            arg: 'cleanstart',
            env: 'CLEAN_START'
        },
        sampledata: {
            format: 'Boolean',
            default: false,
            arg: 'sampledata',
            env: 'SAMPLE_DATA'
        },
        db: {
            host: { // host, rather than hostname, as mysql connection string uses 'host'
                format: String,
                default: 'localhost',
                arg: 'mysql-host',
                env: 'SENG365_MYSQL_HOST'
            },
            port: {
                format: 'port',
                default: 6033,
                arg: 'mysql-port',
                env: 'SENG365_MYSQL_PORT'
            },
            user: {
                format: String,
                default: 'root',
                arg: 'mysql-user',
                env: 'SENG365_MYSQL_USER'
            },
            password: {
                format: String,
                default: 'secret',
                arg: 'mysql-password',
                env: 'SENG365_MYSQL_PASSWORD'
            },
            database: {
                format: String,
                default: 'mysql',
                arg: 'mysql-database',
                env: 'SENG365_MYSQL_DATABASE'
            }
        }
    });

config.loadFile(path.join(__dirname, `${config.get('env')}.json`)).validate();
module.exports = config;
