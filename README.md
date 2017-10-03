# Crowdfunding API v2 service implementation

A reference implementation for the api specification in `config/swagger-api-v2.1.6.json`.

The code is based on the skeletons from labs 3 and 4, and so has a mix of callbacks and promises, with extensions to the lab framework mostly being promise-based.

## Version history

### Version 2.1.7, 3 October 2017

- Fix for issue where projects created without rewards would crash model
- Functional but minimal skeleton for adding sample data on startup and through /admin/reset endpoint

### Version 2.1.6, 2 October 2017

- API version now 2.1.6
  - Always return backers and progress in GET /projects/:id. If no backers yet, then backers will be [] and progress.currentPledged and progress.numberOfBackers will both be 0.
  
### Version 2.1.5, 2 October 2017

- API version now 2.1.5
  - Corrected type of PUT /projects/:id/image to raw binary with content type of image/png or image/jpeg
- Reject an attempt to login if already logged in

### Version 2.1.4, 29 September 2017

- Updated to v2.1.4 of the API
  - Allow logins by either username or email
- Now can validate any defined query parameters not just those for GET /projects
- Fix issue where invalid query parameters to GET /projects would not send a response (res.status was used instead of res.sendStatus)
  
### Version 2.1.3, 27 September 2017

- API version now 2.1.3
  - Pledges now match user stories 2 and 5 in updated Assignment 2 briefing.
  - The 'backers' section of the ProjectDetails now contains all pledges in time-order, with username given as anonymous for anonymous pledges
  - The 'progress' section of the ProjectDetails contains the total of all pledges, and the number of unique userIds making pledges, where all anonymous backers are aggregated into one
- Tightened up schema validation to reject unexpected properties and array elements
- Added server-side CORS support for browsers
- Fix to include both token and id in response to POST /users/login

### Version 2.1.2, 

- Updated to v2.1.2 of the API and some small tidy-ups

## Usage

To start the backend service, and initialise the database, `npm start` (preferred), or `node server.js` or `docker-compose up -d`.

## Configuration

Configuration defaults are in `config/config.js`. These can be overridden in two ways (in priority order):

1. By environment variable, or command line parameter, to override any individual configuration setting. See `config/config.js` for options.
1. By values given in a javascript file in `config` named in the environment variable `NODE_ENV`, or the command line parameter `env`.
For example, if the service is started with `node server.js --env=production`, the configuration in `config/production.js` will override any default values
(but not individual values set through the environment or command line).

The default configuration assumes that a MySQL database can be found at `mysql://localhost:6033`, and that the service will run
on `http://localhost:4941/api/v2`.

For use with the department's `mysql2` MySQL server, create a config file in `config/production.json` based on the following
and start the service with `node server.js --env=production`:

```
{
    "db": {
        "host": "mysql2.csse.canterbury.ac.nz",
        "port": 3306,
        "user": <your UC usercode>,
        "password": <your assigned password - see email from beginning Term 3>,
        "database": <your UC usercode>
    }
}
```

### Tests

Some simple unit tests can be run through `npm test`. They assume that a database is already running on the defined config.

The full API can be tested by starting this service with `npm start` and then running the tests from the `api-v2-test` repo.