'use strict';

// native node modules
var util = require('util');

// 3rd party modules
var _ = require('lodash'),
  q = require('q'),
  OniyiHttpClient = require('oniyi-http-client');

var xml = require('./lib/xml-utils');

// local variable definitions
var xmlNS = {
  atom: 'http://www.w3.org/2005/Atom',
  snx: 'http://www.ibm.com/xmlns/prod/sn',
  app: 'http://www.w3.org/2007/app',
  openSearch: 'http://a9.com/-/spec/opensearch/1.1/',
  ibmsc: 'http://www.ibm.com/search/content/2010',
  td: 'urn:ibm.com/td',
  thr: 'http://purl.org/syndication/thread/1.0',
  fh: 'http://purl.org/syndication/history/1.0'
};

// local function definition
function getAuthPath(requestOptions) {
  if (requestOptions.auth && _.isString(requestOptions.auth.bearer)) {
    return '/oauth';
  }
  return '';
}

// // here begins the parser functions definition section
var responseParser = {
  wikisFeedParser: function parseWikisFeedResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML);
    }

    var entries = Array.prototype.map.call(responseXML.getElementsByTagName('entry'), function(element) {
      var entry = {};
      entry.id = element.getElementsByTagName('id')[0].textContent;
      entry.uuid = element.getElementsByTagNameNS(xmlNS.td, 'uuid')[0].textContent;
      entry.label = element.getElementsByTagNameNS(xmlNS.td, 'label')[0].textContent;
      entry.title = (xml.find(element, 'title[type="text"]')[0]).textContent;
      entry.summary = (xml.find(element, 'summary[type="text"]')[0]).textContent;
      entry.links = {
        self: (xml.find(element, 'link[rel="self"]')[0]).getAttribute('href'),
        edit: (xml.find(element, 'link[rel="edit"]')[0]).getAttribute('href')
      };
      return entry;
    });
    return entries;
  },
  pagesFeedParser: function parsePagesFeedResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML);
    }

    var entries = Array.prototype.map.call(responseXML.getElementsByTagName('entry'), function(element) {
      return responseParser.pageEntryParser(element);
    });
    return entries;
  },
  pageEntryParser: function parsePageEntryResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML);
    }
    var entry = {};
    entry.id = responseXML.getElementsByTagName('id')[0].textContent;
    entry.uuid = responseXML.getElementsByTagNameNS(xmlNS.td, 'uuid')[0].textContent;
    entry.label = responseXML.getElementsByTagNameNS(xmlNS.td, 'label')[0].textContent;
    entry.title = (xml.find(responseXML, 'title[type="text"]')[0]).textContent;
    entry.summary = (xml.find(responseXML, 'summary[type="text"]')[0]).textContent;
    entry.links = {
      self: (xml.find(responseXML, 'link[rel="self"]')[0]).getAttribute('href'),
      edit: (xml.find(responseXML, 'link[rel="edit"]')[0]).getAttribute('href'),
      editMedia: (xml.find(responseXML, 'link[rel="edit-media"]')[0]).getAttribute('href'),
      enclosure: (xml.find(responseXML, 'link[rel="enclosure"]')[0]).getAttribute('href'),
      related: (xml.find(responseXML, 'link[rel="related"]')[0]).getAttribute('href'),
      replies: (xml.find(responseXML, 'link[rel="replies"]')[0]).getAttribute('href')
    };
    return entry;
  },
  pageMediaParser: function parsePageEntryResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML);
    }

    var result = xml.serialize(responseXML)
      .replace('<?xml version="1.0" encoding="UTF-8"?>', '')
      .replace('<!DOCTYPE html>', '');
    result = _.unescape(result);
    return result;
  }
};

// the "class" definition
function IbmConnectionsWikisService(baseUrl, options) {
  var self = this;

  options = _.merge({
    requestOptions: {
      baseUrl: baseUrl,
      headers: {
        'user-agent': 'Mozilla/5.0'
      }
    }
  }, options);

  OniyiHttpClient.call(self, options);

  self.baseUrl = baseUrl;

  // @TODO: generalize this plugin
  self.registerPlugin({
    name: 'response.statusCode',
    callback: function(next, err, response, body) {
      if (err || !response) {
        next.call(this, err, response, body);
        return;
      }
      if (response.statusCode !== 200) {
        var error = new Error(body ||  'Wrong statusCode');
        error.httpStatus = response.statusCode;
        next.call(this, error, response, body);
        return;
      }
      next.call(this, err, response, body);
    }
  });
}
util.inherits(IbmConnectionsWikisService, OniyiHttpClient);

IbmConnectionsWikisService.prototype.getWikisFeed = function(options) {
  var self = this;

  var qsValidParameters = [
    'acls',
    'includeTags',
    'page',
    'ps',
    'role',
    'sI',
    'sortBy',
    'sortOrder'
  ];

  // construct the request options
  var requestOptions = _.merge(self.extractRequestParams(options, ['baseUrl', 'uri', 'method', 'qs']), {
    qs: _.pick(options, qsValidParameters)
  });

  var authPath = getAuthPath(requestOptions);

  requestOptions.uri = authPath + '/api/mywikis/feed';

  // the makeRequest function can take two or three arguments
  // the last has to be a function (which is done by q.ninvoke --> passes a callback with node conventions (err, data))
  return q.ninvoke(self, 'makeRequest', requestOptions)
    .spread(function(response, body) {
      // expexted
      // status codes: 200, 403, 404
      // content-type: application/atom+xml
      if (!response || response.statusCode !== 200) {
        return q.reject(new Error('received invalid response'));
      }

      return responseParser.wikisFeedParser(body);
    });
};

IbmConnectionsWikisService.prototype.getPagesFeed = function(options) {
  var self = this;
  var error;

  if (!options.wikilabel) {
    error = new Error('options.wikilabel must be defined');
    error.httpStatus = 400;
    return q.reject(error);
  }

  var qsValidParameters = [
    'acls',
    'includeTags',
    'page',
    'ps',
    'role',
    'sI',
    'sortBy',
    'sortOrder'
  ];

  // construct the request options
  var requestOptions = _.merge(self.extractRequestParams(options, ['baseUrl', 'uri', 'method', 'qs']), {
    qs: _.pick(options, qsValidParameters)
  });

  var authPath = getAuthPath(requestOptions);

  requestOptions.uri = util.format('%s/api/wiki/%s/feed', authPath, options.wikilabel);

  // the makeRequest function can take two or three arguments
  // the last has to be a function (which is done by q.ninvoke --> passes a callback with node conventions (err, data))
  return q.ninvoke(self, 'makeRequest', requestOptions)
    .spread(function(response, body) {
      // expexted
      // status codes: 200, 403, 404
      // content-type: application/atom+xml
      if (!response || response.statusCode !== 200) {
        return q.reject(new Error('received invalid response'));
      }

      return responseParser.pagesFeedParser(body);
    });
};

IbmConnectionsWikisService.prototype.getPage = function(options) {
  var self = this;
  var error;

  if (!options.wikilabel) {
    error = new Error('options.wikilabel must be defined');
    error.httpStatus = 400;
    return q.reject(error);
  }

  if (!options.pagelabel) {
    error = new Error('options.pagelabel must be defined');
    error.httpStatus = 400;
    return q.reject(error);
  }

  var qsValidParameters = [
    // 'format', // tested this query parameter --> does not have any effect
    'acls',
    'includeTags'
  ];

  // construct the request options
  var requestOptions = _.merge(self.extractRequestParams(options, ['baseUrl', 'uri', 'method', 'qs']), {
    qs: _.pick(options, qsValidParameters)
  });

  var authPath = getAuthPath(requestOptions);

  requestOptions.uri = util.format('%s/api/wiki/%s/page/%s/entry', authPath, options.wikilabel, options.pagelabel);

  // the makeRequest function can take two or three arguments
  // the last has to be a function (which is done by q.ninvoke --> passes a callback with node conventions (err, data))
  return q.ninvoke(self, 'makeRequest', requestOptions)
    .spread(function(response, body) {
      // expexted
      // status codes: 200, 403, 404
      // content-type: application/atom+xml
      if (!response || response.statusCode !== 200) {
        return q.reject(new Error('received invalid response'));
      }

      return responseParser.pageEntryParser(body);
    });
};

IbmConnectionsWikisService.prototype.getPageMedia = function(options) {
  var self = this;

  return self.getPage(options)
    .then(function(page) {
      var requestOptions = self.extractRequestParams(options);
      delete requestOptions.baseUrl;
      requestOptions.uri = page.links.editMedia.replace(self.baseUrl, '').replace('oauth', 'basic');
      return q.ninvoke(self, 'makeRequest', requestOptions)
        .spread(function(response, body) {
          // expexted
          // status codes: 200, 403, 404
          // content-type: application/atom+xml
          if (!response || response.statusCode !== 200) {
            return q.reject(new Error('received invalid response'));
          }

          return responseParser.pageMediaParser(body);
        });
    });
};

module.exports = IbmConnectionsWikisService;
