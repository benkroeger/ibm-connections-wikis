'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules

const omitDefaultRequestParams = (params, extraOmmit = []) =>
  _.omit(params, ['uri', 'url', 'method', 'qs', 'baseUrl', ...extraOmmit]);

function constructError(message, statusCode) {
  const error = new Error(message);
  error.httpStatus = statusCode;
  return error;
}

module.exports = {
  omitDefaultRequestParams,
  constructError,
};
