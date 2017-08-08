'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const logger = require('oniyi-logger')('ibm-connections-wikis-service:lib:response-parser');

// internal modules
const wikiPageParser = require('./wiki-page-parser');
const wikiPageVersionParser = require('./wiki-page-version-parser');
const wikiPageCommentsParser = require('./wiki-page-comments-parser');
const { ensureXMLDoc, initParser, serializeXML } = require('./../utils/utility');
const xmlNS = require('./../constants/xml-namespaces.json');

const selectXPath = initParser(xmlNS);

const responseParser = {
  navigationFeed: function navigationFeedParser(responseJSON) {
    try {
      const navigationFeed = JSON.parse(responseJSON);
      return { navigationFeed };
    } catch (err) {
      logger.debug('Unable to perform JSON.parse() on {{%o}}. Error: %o', responseJSON, err);
      return {};
    }
  },
  // main wikiPage, /wiki/{wikiId}/page/{pageId}/entry
  wikiPage: function wikiPageParserFunction(responseXML) {
    const response = ensureXMLDoc(responseXML);
    const selectorEntry = selectXPath('/atom:entry', response, true);

    return {
      wikiPage: wikiPageParser(selectorEntry),
    };
  },
  // parser retrieving artifacts feed from certain page, /wiki/{wikiId}/page/{pageId}/feed?category=version(optional query)
  pageComments: function pageCommentsParser(responseXML) {
    const response = ensureXMLDoc(responseXML);
    const selectorEntries = selectXPath('/atom:feed/atom:entry', response);
    const pageComments = _.map(selectorEntries, entry => wikiPageCommentsParser(entry));

    return { pageComments };
  },
  pageVersions: function pageCommentsParser(responseXML) {
    const response = ensureXMLDoc(responseXML);
    const selectorEntries = selectXPath('/atom:feed/atom:entry', response);
    const pageVersions = _.map(selectorEntries, entry => wikiPageVersionParser(entry));

    return { pageVersions };
  },

  // parser retrieving version entry from certain page, /wiki/{wikiId}/page/{pageId}/version/{versionId}/entry
  pageVersionDetails: function pageVersionParser(responseXML) {
    const response = ensureXMLDoc(responseXML);
    const selectorEntry = selectXPath('/atom:entry', response, true);

    return {
      pageVersionDetails: wikiPageVersionParser(selectorEntry),
    };
  },
  // media parser used for extracting html content from page and version response
  mediaContent: function mediaContentParser(responseXML) {
    const response = ensureXMLDoc(responseXML);

    let result = serializeXML(response)
      .replace('<?xml version="1.0" encoding="UTF-8"?>', '')
      .replace('<!DOCTYPE html>', '')
      .replace(/<STYLE[\s\S]*?<\/STYLE>/, '');
    result = _.unescape(result);

    return {
      mediaContent: result,
    };
  },
};

module.exports = responseParser;
