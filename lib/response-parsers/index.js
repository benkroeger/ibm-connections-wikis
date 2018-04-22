'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const { ensureXMLDoc, serialize: serializeXML } = require('oniyi-utils-xml');

// internal modules
const xpath = require('../xpath-select');
const wikiPageParser = require('./wiki-page-parser');
const wikiPageVersionParser = require('./wiki-page-version-parser');
const wikiPageCommentsParser = require('./wiki-page-comments-parser');

const responseParser = {
  // main wikiPage, /wiki/{wikiId}/page/{pageId}/entry
  wikiPage: function wikiPageParserFunction(responseXML) {
    const xmlDocument = ensureXMLDoc(responseXML);
    const selectorEntry = xpath('/atom:entry', xmlDocument, true);

    return {
      wikiPage: wikiPageParser(selectorEntry),
    };
  },
  // parser retrieving artifacts feed from certain page, /wiki/{wikiId}/page/{pageId}/feed?category=version(optional query)
  pageComments: function pageCommentsParser(responseXML) {
    const xmlDocument = ensureXMLDoc(responseXML);
    const selectorEntries = xpath('/atom:feed/atom:entry', xmlDocument);

    const result = {
      totalResults: xpath('number(atom:feed/opensearch:totalResults/text())', xmlDocument, true),
      entries: _.map(selectorEntries, entry => wikiPageCommentsParser(entry)),
    };

    return result;
  },
  pageVersions: function pageCommentsParser(responseXML) {
    const xmlDocument = ensureXMLDoc(responseXML);
    const selectorEntries = xpath('/atom:feed/atom:entry', xmlDocument);

    const result = {
      totalResults: xpath('number(atom:feed/opensearch:totalResults/text())', xmlDocument, true),
      entries: _.map(selectorEntries, entry => wikiPageVersionParser(entry)),
    };

    return result;
  },

  // parser retrieving version entry from certain page, /wiki/{wikiId}/page/{pageId}/version/{versionId}/entry
  pageVersionDetails: function pageVersionParser(responseXML) {
    const xmlDocument = ensureXMLDoc(responseXML);
    const selectorEntry = xpath('/atom:entry', xmlDocument, true);

    return {
      pageVersionDetails: wikiPageVersionParser(selectorEntry),
    };
  },
  // media parser used for extracting html content from page and version response
  mediaContent: function mediaContentParser(responseXML) {
    const xmlDocument = ensureXMLDoc(responseXML);

    let result = serializeXML(xmlDocument)
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
