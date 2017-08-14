'use strict';

// core node modules

// 3rd party modules
const { selectUseNamespaces } = require('oniyi-utils-xml');

// internal modules
const xmlNS = require('./constants/xml-namespaces.json');

module.exports = selectUseNamespaces(xmlNS);
