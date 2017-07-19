#  IBM Connections Wikis Service

> an implementation for the IBM Connections Wiki API


## Install

```sh
$ npm install --save ibm-connections-wikis-service
```


## Usage

After you require wiki service, you may easily setup the default properties. 
```js
const IbmConnectionsWikisService = require('ibm-connections-wikis-service');

const defaults = {
  headers: {
    Authorization: 'Basic 12345', // or any other auth method
  },
};
```

Beside default authorization, this service supports ```oniyi-http-plugin-credentials``` and ```oniyi-http-plugin-format-url-template```.

**Credentials** plugin is used only if ```plugins.credentials``` is provided.

**Format-url-template** is used by default, and it is recommended to use it in combination with **credentials** plugin.

For more details about plugins usage, please visit:

[oniyi-http-plugin-credentials](https://www.npmjs.com/package/oniyi-http-plugin-credentials)

[oniyi-http-plugin-format-url-template](https://www.npmjs.com/package/oniyi-http-plugin-format-url-template)

```js
const plugins = {
  credentials: {
    providerName: 'customProvider',
    userRelationProp: 'credentials',
  },
  formatUrlTemplate: {
    valuesMap: {
      authType: {
        basic: 'customAuthType', 
      }
    },
    applyToQueryString: true,
  }
};

const serviceOptions = {
  defaults,
  plugins,
  baseUrl: 'https://fake.base.url.com',
};

const source = new IbmConnectionsWikisService(serviceOptions.baseUrl, serviceOptions);
```

If not, please provide you own authorization type directly into ```requestParams``` object as explained in service methods usage below.
Once source instance is created, you are able to use next methods:
```
1. source.feeds.navigationFeed
2. source.feeds.wikiPage
3. source.feeds.pageVersion
4. source.feeds.pageArtifacts
5. source.feeds.mediaContent
```

Every method comes with two arguments, ```requestParams``` and ```callback```

#### 1. source.feeds.navigationFeed

In order to retrieve wiki navigation tree, it is necessary to provide ```wikiLabel``` through ```requestParams``` object.

```js
const requestParams = {
  wikiLabel: '444a24f4-28a2-45a4-b21a-a55120f1ca72',
  authType: 'oauth',
};

source.feeds.navigationFeed(requestParams, (err, response) => {
  const { navigationFeed } = response;
  
  // use navigationFeed object to retrieve data about wiki navigation tree
});
```

#### 2. source.feeds.wikiPage

If you require wiki page, simply provide ```wikiLabel``` and ```pageLabel``` to ```requestParams``` object.

```js
const requestParams = {
  wikiLabel: '444a24f4-28a2-45a4-b21a-a55120f1ca72',
  pageLabel: '123a24f4-48a2-45a4-551a-a5fferq1ca66',
};

source.feeds.wikiPage(requestParams, (err, response) => {
  const { wikiPage } = response;
  
  // use wikiPage object to extract metadata about title, updated time, content, author, modifier etc.
});
```

#### 3. source.feeds.pageVersion

Page version belongs to a wiki page. Every page have one initial version, and could have many more.
Provide ```requestParams``` with ```wikiLabel```, ```pageLabel``` and ```versionLabel``` in order to get info about certain version.

```js
const requestParams = {
  wikiLabel: '444a24f4-28a2-45a4-b21a-a55120f1ca72',
  pageLabel: '123a24f4-48a2-45a4-551a-a5fferq1ca66',
  versionLabel: '3214a24f4-48a2-45a4-b21a-b5f4433ckl2',
};

source.feeds.pageVersion(requestParams, (err, response) => {
  const { pageVersion } = response;
  
  // use pageVersion object to extract metadata about this particular version
});
```
Mapping between this service and an actual IBM Connections Wiki API:

```
/api/wiki/{wikiId}/page/{pageId}/version/{versionId}/entry

wikiId = wikiLabel
pageId = pageLabel
versionId = versionLabel
```

#### 4. source.feeds.pageArtifacts

This is an API that, when called without query, returns feed of comments that belong to a wiki page.

```js
const requestParams = {
  wikiLabel: '444a24f4-28a2-45a4-b21a-a55120f1ca72',
  pageLabel: '123a24f4-48a2-45a4-551a-a5fferq1ca66',
};

source.feeds.pageArtifacts(requestParams, (err, response) => {
  const { pageComments } = response;
  
  // use pageComments Array get content and metadata of all comments with provided wikiLabel and pageLabel
});
```

If the same method was called with ```version``` category sent via query, it will return all versions that belong to the same page.
```js
const requestParams = {
  query: {
    category: 'version',
  },
  wikiLabel: '444a24f4-28a2-45a4-b21a-a55120f1ca72',
  pageLabel: '123a24f4-48a2-45a4-551a-a5fferq1ca66',
};

source.feeds.pageArtifacts(requestParams, (err, response) => {
  const { pageVersions } = response;
  
  // use pageVersions Array get content and metadata of all versions with provided wikiLabel and pageLabel
});
```

#### 5. source.feeds.mediaContent

In order to retrieve media content from a wiki page, or wiki version page, it is necessary to follow these steps:

   - Call wikiPage() or pageVersion() API as explained in steps 2. and 3.
   - Extract ```content.src``` from the response object
   - Provide default ```mediaAuthType```, which can be configurable by using **format-url-template** plugin
   - Combine extracted ```content``` and ``mediaAuthType``` with the current ```requestParams```

```js
  const requestParams = {
    wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
  };

  source.feeds.wikiPage(requestParams, (err, response) => {
    /* Handle error here */
    const content = response.wikiPage.content.src;
    source.feeds.mediaContent(_.assign({ content, mediaAuthType: 'oauth' }, requestParams), (error, mediaData) => {
      // use mediaData here
    });
  });
```
Since ```mediaContent``` might require different authentication while making a request,this way we are making sure that 
only ```mediaContent``` request is affected by any ```mediaAuthType``` mapping.
 
If, however, we used regular ```authType``` template mechanism, this would lead to mapping all uris that support ```authType``` template
in order to change only one single request (assuming that ```mediaContent``` requires different authentication from any other service method).

## Notes

For the best performance and readability, it is recommended to use ```async``` module if creating connected API calls.

```js
const async = require('async');

// ... setup source instance

async.waterfall([
  (done) => source.feeds.wikiPage({}, done),
  (response, done) => {
  /* parse response here */
  source.feeds.mediaContent({}, done);
  },
  //...
  (err, result) => {/* parse result */ }
]);

```

## License

UNLICENSED ©  [GIS AG](https://gis-ag.com)