'use strict';

// node core modules

// 3rd party modules

// internal modules

const contentPathRegex = /^https?:\/\/[^\/]+\/wikis\/(.+)/;
const selectFirstPath = /(.+?)\//;
const injectAuthTypeTemplate = contentPath => contentPath.replace(selectFirstPath, '{ authType }/');

module.exports = (params = {}) => {
  const content = ((url) => {
    if (!url) {
      return url;
    }

    const [, contentPath] = contentPathRegex.exec(url);
    return injectAuthTypeTemplate(contentPath);
  })(params.content);

  return {
    navigationFeed: {
      uri: '{ authType }/api/wiki/{ wikiLabel }/nav/feed',
      queryParams: {
        breadcrumb: 'breadcrumb',
        parent: 'parent',
        timestamp: 'timestamp',
      },
    },
    wikiPage: {
      uri: '{ authType }/api/wiki/{ wikiLabel }/page/{ pageLabel }/entry',
      queryParams: {
        acls: 'acls',
        includeTags: 'includeTags',
      },
    },
    pageArtifacts: {
      uri: '{ authType }/api/wiki/{ wikiLabel }/page/{ pageLabel }/feed',
      queryParams: {
        sO: 'sO', // sort order
        ps: 'ps', // page size, default is 10
        category: 'category',  // category of feed
      },
    },
    pageVersion: {
      uri: '{ authType }/api/wiki/{ wikiLabel }/page/{ pageLabel }/version/{ versionLabel }/entry',
      queryParams: {
        sO: 'sO', // sort order
        ps: 'ps', // page size, default is 10
      },
    },
    mediaContent: {
      uri: content,
      queryParams: {},
    },
  };
};
