(function () {

/* Imports */
var _ = Package.underscore._;
var DDP = Package.ddp.DDP;
var DDPServer = Package.ddp.DDPServer;
var Meteor = Package.meteor.Meteor;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var WebApp = Package.webapp.WebApp;
var main = Package.webapp.main;
var WebAppInternals = Package.webapp.WebAppInternals;
var Log = Package.logging.Log;
var Tracker = Package.deps.Tracker;
var Deps = Package.deps.Deps;
var Blaze = Package.ui.Blaze;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var EasySearch;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem:easy-search/lib/easy-search-common.js                                                       //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
EasySearch = (function () {                                                                                       // 1
  'use strict';                                                                                                   // 2
                                                                                                                  // 3
  var ESCounts,                                                                                                   // 4
    Searchers,                                                                                                    // 5
    indexes = {/** @see defaultOptions */},                                                                       // 6
    defaultOptions = {                                                                                            // 7
      'format' : 'mongo',                                                                                         // 8
      'skip' : 0,                                                                                                 // 9
      'limit' : 10,                                                                                               // 10
      'use' : 'minimongo',                                                                                        // 11
      'reactive' : true,                                                                                          // 12
      'props' : {},                                                                                               // 13
      'transform' : function () {},                                                                               // 14
      'sort' : function () {                                                                                      // 15
        if (Searchers[this.use]) {                                                                                // 16
          return Searchers[this.use].defaultSort(this);                                                           // 17
        }                                                                                                         // 18
                                                                                                                  // 19
        return {};                                                                                                // 20
      },                                                                                                          // 21
      'reactiveSort' : function () {                                                                              // 22
        if ('minimongo' === this.use || 'mongo-db' === this.use) {                                                // 23
          return this.sort();                                                                                     // 24
        }                                                                                                         // 25
      },                                                                                                          // 26
      'count' : function () {                                                                                     // 27
        var doc = ESCounts.findOne({ _id : this.name });                                                          // 28
                                                                                                                  // 29
        if (doc) {                                                                                                // 30
          return doc.count;                                                                                       // 31
        }                                                                                                         // 32
                                                                                                                  // 33
        return 0;                                                                                                 // 34
      },                                                                                                          // 35
      'changeResults' : function (results) {                                                                      // 36
        return results;                                                                                           // 37
      },                                                                                                          // 38
      /**                                                                                                         // 39
       * When using elastic-search it's the query object,                                                         // 40
       * while using with mongo-db it's the selector object.                                                      // 41
       *                                                                                                          // 42
       * @param {String} searchString                                                                             // 43
       * @param {Object} options                                                                                  // 44
       * @return {Object}                                                                                         // 45
       */                                                                                                         // 46
      'query' : function (searchString, options) {                                                                // 47
        return Searchers[this.use].defaultQuery(this, searchString);                                              // 48
      }                                                                                                           // 49
    };                                                                                                            // 50
                                                                                                                  // 51
  ESCounts = new Mongo.Collection('esCounts');                                                                    // 52
                                                                                                                  // 53
  /** Helper Functions */                                                                                         // 54
  function setUpPublication(name, opts) {                                                                         // 55
    Meteor.publish(name + '/easySearch', function (conf) {                                                        // 56
      var resultSet,                                                                                              // 57
        findOptions = {},                                                                                         // 58
        resultArray = [],                                                                                         // 59
        publishScope = this,                                                                                      // 60
        publishHandle;                                                                                            // 61
                                                                                                                  // 62
      check(conf, { value: Match.Optional(String), skip: Number, limit: Match.Optional(Number), props: Object }); // 63
                                                                                                                  // 64
      indexes[name].skip = conf.skip;                                                                             // 65
      indexes[name].limit = conf.limit || indexes[name].limit;                                                    // 66
      indexes[name].props = _.extend(indexes[name].props, conf.props);                                            // 67
      indexes[name].publishScope = this;                                                                          // 68
                                                                                                                  // 69
      resultSet = Searchers[opts.use].search(name, conf.value, indexes[name]);                                    // 70
                                                                                                                  // 71
      ESCounts.update({ _id: name }, { $set: { count: resultSet.total } }, { upsert: true });                     // 72
                                                                                                                  // 73
      if (!resultSet.results.length) return this.ready();                                                         // 74
                                                                                                                  // 75
      if (_.isObject(resultSet.results[0])) {                                                                     // 76
        resultArray = _.pluck(resultSet.results, '_id');                                                          // 77
      } else if (_.isString(resultSet.results[0])) {                                                              // 78
        resultArray = resultSet.results;                                                                          // 79
      }                                                                                                           // 80
                                                                                                                  // 81
      // properly observe the collection!                                                                         // 82
      if (opts.returnFields) {                                                                                    // 83
        findOptions.fields = EasySearch._transformToFieldSpecifiers(opts.returnFields);                           // 84
      }                                                                                                           // 85
                                                                                                                  // 86
      // see http://stackoverflow.com/questions/3142260/order-of-responses-to-mongodb-in-query                    // 87
      resultArray = _.map(resultArray, function (id) {                                                            // 88
        return { _id: id };                                                                                       // 89
      });                                                                                                         // 90
                                                                                                                  // 91
      publishHandle = opts.collection                                                                             // 92
        .find({ $or: resultArray }, findOptions)                                                                  // 93
        .observe({                                                                                                // 94
          added: function (doc) {                                                                                 // 95
            doc._index = name;                                                                                    // 96
            publishScope.added('esSearchResults', doc._id, doc);                                                  // 97
          },                                                                                                      // 98
          changed: function (doc) {                                                                               // 99
            publishScope.changed('esSearchResults', doc._id, doc);                                                // 100
          },                                                                                                      // 101
          removed: function (doc) {                                                                               // 102
            publishScope.removed('esSearchResults', doc._id);                                                     // 103
          }                                                                                                       // 104
        }                                                                                                         // 105
      );                                                                                                          // 106
                                                                                                                  // 107
      publishScope.onStop(function () {                                                                           // 108
        publishHandle.stop();                                                                                     // 109
      });                                                                                                         // 110
                                                                                                                  // 111
      publishScope.ready();                                                                                       // 112
    });                                                                                                           // 113
                                                                                                                  // 114
    Meteor.publish(name + '/easySearchCount', function () {                                                       // 115
      return ESCounts.find({ '_id' : name });                                                                     // 116
    });                                                                                                           // 117
  }                                                                                                               // 118
                                                                                                                  // 119
  function extendTransformFunction(collection, originalTransform) {                                               // 120
    return function (doc) {                                                                                       // 121
      var transformedDoc = collection._transform(doc);                                                            // 122
      return _.isFunction(originalTransform) ? originalTransform(transformedDoc) : transformedDoc;                // 123
    };                                                                                                            // 124
  }                                                                                                               // 125
                                                                                                                  // 126
  if (Meteor.isClient) {                                                                                          // 127
    /**                                                                                                           // 128
     * find method to let users interact with search results.                                                     // 129
     *                                                                                                            // 130
     * @param {Object} selector                                                                                   // 131
     * @param {Object} options                                                                                    // 132
     * @returns {MongoCursor}                                                                                     // 133
     */                                                                                                           // 134
    defaultOptions.find = function (selector, options) {                                                          // 135
      selector = selector || {};                                                                                  // 136
      selector._index = this.name;                                                                                // 137
                                                                                                                  // 138
      if (this.collection._transform) {                                                                           // 139
        options.transform = extendTransformFunction(this.collection, options.transform);                          // 140
      }                                                                                                           // 141
                                                                                                                  // 142
      return ESSearchResults.find(selector, options);                                                             // 143
    };                                                                                                            // 144
                                                                                                                  // 145
    /**                                                                                                           // 146
     * findOne method to let users interact with search results.                                                  // 147
     *                                                                                                            // 148
     * @param {Object} selector                                                                                   // 149
     * @param {Object} options                                                                                    // 150
     * @returns {Document}                                                                                        // 151
     */                                                                                                           // 152
    defaultOptions.findOne = function (selector, options) {                                                       // 153
      if (_.isObject(selector) || !selector) {                                                                    // 154
        selector = selector || {};                                                                                // 155
        selector._index = this.name;                                                                              // 156
      }                                                                                                           // 157
                                                                                                                  // 158
      if (this.collection._transform) {                                                                           // 159
        options.transform = extendTransformFunction(this.collection, options.transform);                          // 160
      }                                                                                                           // 161
                                                                                                                  // 162
      return ESSearchResults.findOne(selector, options);                                                          // 163
    };                                                                                                            // 164
  }                                                                                                               // 165
                                                                                                                  // 166
                                                                                                                  // 167
  /**                                                                                                             // 168
   * Searchers contains all engines that can be used to search content, until now:                                // 169
   *                                                                                                              // 170
   * minimongo (client): Client side collection for reactive search                                               // 171
   * elastic-search (server): Elastic search server to search with (fast)                                         // 172
   * mongo-db (server): MongoDB on the server to search (more convenient)                                         // 173
   *                                                                                                              // 174
   */                                                                                                             // 175
  Searchers = {};                                                                                                 // 176
                                                                                                                  // 177
  return {                                                                                                        // 178
    /**                                                                                                           // 179
     * Placeholder config method.                                                                                 // 180
     *                                                                                                            // 181
     * @param {Object} newConfig                                                                                  // 182
     */                                                                                                           // 183
    'config' : function (newConfig) {                                                                             // 184
      return {};                                                                                                  // 185
    },                                                                                                            // 186
    /**                                                                                                           // 187
     * Simple logging method.                                                                                     // 188
     *                                                                                                            // 189
     * @param {String} message                                                                                    // 190
     * @param {String} type                                                                                       // 191
     */                                                                                                           // 192
    'log' : function (message, type) {                                                                            // 193
      type = type || 'log';                                                                                       // 194
                                                                                                                  // 195
      if (console && _.isFunction(console[type])) {                                                               // 196
        return console[type](message);                                                                            // 197
      } else if (console && _.isFunction(console.log)) {                                                          // 198
        return console.log(message);                                                                              // 199
      }                                                                                                           // 200
    },                                                                                                            // 201
    /**                                                                                                           // 202
     * Create a search index.                                                                                     // 203
     *                                                                                                            // 204
     * @param {String} name                                                                                       // 205
     * @param {Object} options                                                                                    // 206
     */                                                                                                           // 207
    'createSearchIndex' : function (name, options) {                                                              // 208
      check(name, Match.OneOf(String, null));                                                                     // 209
      check(options, Object);                                                                                     // 210
                                                                                                                  // 211
      options.name = name;                                                                                        // 212
      options.field = _.isArray(options.field) ? options.field : [options.field];                                 // 213
      indexes[name] = _.extend(_.clone(defaultOptions), options);                                                 // 214
                                                                                                                  // 215
      options = indexes[name];                                                                                    // 216
                                                                                                                  // 217
      if (options.permission) {                                                                                   // 218
        EasySearch.log(                                                                                           // 219
            'permission property is now deprecated! Return false inside a custom query method instead',           // 220
            'warn'                                                                                                // 221
        );                                                                                                        // 222
      }                                                                                                           // 223
                                                                                                                  // 224
      if (Meteor.isServer && EasySearch._usesSubscriptions(name)) {                                               // 225
        setUpPublication(name, indexes[name]);                                                                    // 226
      }                                                                                                           // 227
                                                                                                                  // 228
      Searchers[options.use] && Searchers[options.use].createSearchIndex(name, options);                          // 229
    },                                                                                                            // 230
    /**                                                                                                           // 231
     * Perform a search.                                                                                          // 232
     *                                                                                                            // 233
     * @param {String} name             the search index                                                          // 234
     * @param {String} searchString     the string to be searched                                                 // 235
     * @param {Object} options          defined with createSearchIndex                                            // 236
     * @param {Function} callback       optional callback to be used                                              // 237
     */                                                                                                           // 238
    'search' : function (name, searchString, options, callback) {                                                 // 239
      var results,                                                                                                // 240
        index = indexes[name],                                                                                    // 241
        searcherType = index.use;                                                                                 // 242
                                                                                                                  // 243
      check(name, String);                                                                                        // 244
      check(searchString, String);                                                                                // 245
      check(options, Object);                                                                                     // 246
      check(callback, Match.Optional(Function));                                                                  // 247
                                                                                                                  // 248
      if ("undefined" === typeof Searchers[searcherType]) {                                                       // 249
        throw new Meteor.Error(500, "Couldnt search with type: '" + searcherType + "'");                          // 250
      }                                                                                                           // 251
                                                                                                                  // 252
      results = Searchers[searcherType].search(name, searchString, _.extend(indexes[name], options), callback);   // 253
                                                                                                                  // 254
      return index.changeResults(results);                                                                        // 255
    },                                                                                                            // 256
    /**                                                                                                           // 257
     * Retrieve a specific index configuration.                                                                   // 258
     *                                                                                                            // 259
     * @param {String} name                                                                                       // 260
     * @return {Object}                                                                                           // 261
     * @api public                                                                                                // 262
     */                                                                                                           // 263
    'getIndex' : function (name) {                                                                                // 264
      return indexes[name];                                                                                       // 265
    },                                                                                                            // 266
    /**                                                                                                           // 267
     * Retrieve all index configurations                                                                          // 268
     */                                                                                                           // 269
    'getIndexes' : function () {                                                                                  // 270
      return indexes;                                                                                             // 271
    },                                                                                                            // 272
    /**                                                                                                           // 273
     * Retrieve a specific Seacher.                                                                               // 274
     *                                                                                                            // 275
     * @param {String} name                                                                                       // 276
     * @return {Object}                                                                                           // 277
     * @api public                                                                                                // 278
     */                                                                                                           // 279
    'getSearcher' : function (name) {                                                                             // 280
      return Searchers[name];                                                                                     // 281
    },                                                                                                            // 282
    /**                                                                                                           // 283
     * Retrieve all Searchers.                                                                                    // 284
     */                                                                                                           // 285
    'getSearchers' : function () {                                                                                // 286
      return Searchers;                                                                                           // 287
    },                                                                                                            // 288
    /**                                                                                                           // 289
     * Loop through the indexes and provide the configuration.                                                    // 290
     *                                                                                                            // 291
     * @param {Array|String} indexes                                                                              // 292
     * @param callback                                                                                            // 293
     */                                                                                                           // 294
    'eachIndex' : function (indexes, callback) {                                                                  // 295
      indexes = !_.isArray(indexes) ? [indexes] : indexes;                                                        // 296
                                                                                                                  // 297
      _.each(indexes, function (index) {                                                                          // 298
        callback(index, EasySearch.getIndex(index));                                                              // 299
      });                                                                                                         // 300
    },                                                                                                            // 301
    /**                                                                                                           // 302
     * Makes it possible to override or extend the different                                                      // 303
     * types of search to use with EasySearch (the "use" property)                                                // 304
     * when using EasySearch.createSearchIndex()                                                                  // 305
     *                                                                                                            // 306
     * @param {String} key      Type, e.g. mongo-db, elastic-search                                               // 307
     * @param {Object} methods  Methods to be used, only 2 are required:                                          // 308
     *                          - createSearchIndex (name, options)                                               // 309
     *                          - search (name, searchString, [options, callback])                                // 310
     *                          - defaultQuery (options, searchString)                                            // 311
     *                          - defaultSort (options)                                                           // 312
     */                                                                                                           // 313
    'createSearcher' : function (key, methods) {                                                                  // 314
      check(key, String);                                                                                         // 315
      check(methods.search, Function);                                                                            // 316
      check(methods.createSearchIndex, Function);                                                                 // 317
                                                                                                                  // 318
      Searchers[key] = methods;                                                                                   // 319
    },                                                                                                            // 320
    /**                                                                                                           // 321
     * Helper to check if searcher uses server side subscriptions for searching.                                  // 322
     *                                                                                                            // 323
     * @param {String} index Index name to check configuration for                                                // 324
     */                                                                                                           // 325
    '_usesSubscriptions' : function (index) {                                                                     // 326
      var conf = EasySearch.getIndex(index);                                                                      // 327
      return conf && conf.reactive && conf.use !== 'minimongo';                                                   // 328
    },                                                                                                            // 329
    /**                                                                                                           // 330
     * Helper to transform an array of fields to Meteor "Field Specifiers"                                        // 331
     *                                                                                                            // 332
     * @param {Array} fields Array of fields                                                                      // 333
     */                                                                                                           // 334
    '_transformToFieldSpecifiers' : function (fields) {                                                           // 335
      var specifiers = {};                                                                                        // 336
                                                                                                                  // 337
      _.each(fields, function (field) {                                                                           // 338
        specifiers[field] = 1;                                                                                    // 339
      });                                                                                                         // 340
                                                                                                                  // 341
      return specifiers;                                                                                          // 342
    }                                                                                                             // 343
  };                                                                                                              // 344
})();                                                                                                             // 345
                                                                                                                  // 346
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem:easy-search/lib/easy-search-convenience.js                                                  //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.Collection.prototype.initEasySearch = function (fields, options) {                                         // 1
  if (!_.isObject(options)) {                                                                                     // 2
    options = {};                                                                                                 // 3
  }                                                                                                               // 4
                                                                                                                  // 5
  EasySearch.createSearchIndex(this._name, _.extend(options, {                                                    // 6
    'collection' : this,                                                                                          // 7
    'field' : fields                                                                                              // 8
  }));                                                                                                            // 9
};                                                                                                                // 10
                                                                                                                  // 11
if (Meteor.isClient) {                                                                                            // 12
  jQuery.fn.esAutosuggestData = function () {                                                                     // 13
    var input = $(this);                                                                                          // 14
                                                                                                                  // 15
    if (input.prop("tagName").toUpperCase() !== 'INPUT') {                                                        // 16
      return [];                                                                                                  // 17
    }                                                                                                             // 18
                                                                                                                  // 19
    return EasySearch.getComponentInstance({'id': input.parent().data('id'), 'index': input.parent().data('index')}).get('autosuggestSelected');
  }                                                                                                               // 21
}                                                                                                                 // 22
                                                                                                                  // 23
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem:easy-search/lib/searchers/mongo.js                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var methods = {                                                                                                   // 1
  /**                                                                                                             // 2
   * Set up a search index.                                                                                       // 3
   *                                                                                                              // 4
   * @param name                                                                                                  // 5
   * @param options                                                                                               // 6
   * @returns {void}                                                                                              // 7
   */                                                                                                             // 8
  'createSearchIndex' : function (name, options) {                                                                // 9
    if (Meteor.isServer) {                                                                                        // 10
      var indexDoc = EasySearch._transformFieldsToIndexDocument(options.field),                                   // 11
        rawCollection = EasySearch.getIndex(name).collection.rawCollection();                                     // 12
                                                                                                                  // 13
      rawCollection.createIndex(                                                                                  // 14
        indexDoc, { name: name }, function (err, res) {                                                           // 15
          options.onCreatedIndex && options.onCreatedIndex(res);                                                  // 16
        }                                                                                                         // 17
      );                                                                                                          // 18
    }                                                                                                             // 19
  },                                                                                                              // 20
  /**                                                                                                             // 21
   *                                                                                                              // 22
   * Perform a really simple search with mongo db.                                                                // 23
   *                                                                                                              // 24
   * @param {String} name                                                                                         // 25
   * @param {String} searchString                                                                                 // 26
   * @param {Object} options                                                                                      // 27
   * @param {Function} callback                                                                                   // 28
   * @returns {Object}                                                                                            // 29
   */                                                                                                             // 30
  'search' : function (name, searchString, options, callback) {                                                   // 31
    var cursor,                                                                                                   // 32
      results,                                                                                                    // 33
      selector,                                                                                                   // 34
      cursorOptions,                                                                                              // 35
      index = EasySearch.getIndex(name);                                                                          // 36
                                                                                                                  // 37
    if (!_.isObject(index)) {                                                                                     // 38
      return;                                                                                                     // 39
    }                                                                                                             // 40
                                                                                                                  // 41
    options.limit = options.limit || 10;                                                                          // 42
                                                                                                                  // 43
    // if several, fields do an $or search, otherwise only over the field                                         // 44
    selector = index.query(searchString, options);                                                                // 45
                                                                                                                  // 46
    if (!selector) {                                                                                              // 47
      return { total: 0, results: [] };                                                                           // 48
    }                                                                                                             // 49
                                                                                                                  // 50
    cursorOptions = {                                                                                             // 51
      sort : index.sort(searchString, options)                                                                    // 52
    };                                                                                                            // 53
                                                                                                                  // 54
    if (options.returnFields) {                                                                                   // 55
      cursorOptions.fields = EasySearch._transformToFieldSpecifiers(options.returnFields);                        // 56
    }                                                                                                             // 57
                                                                                                                  // 58
    if (options.skip) {                                                                                           // 59
      cursorOptions.skip = options.skip;                                                                          // 60
    }                                                                                                             // 61
                                                                                                                  // 62
    cursor = index.collection.find(selector, cursorOptions);                                                      // 63
                                                                                                                  // 64
    results = {                                                                                                   // 65
      'results' : _.first(cursor.fetch(), options.limit),                                                         // 66
      'total' : cursor.count()                                                                                    // 67
    };                                                                                                            // 68
                                                                                                                  // 69
    if (_.isFunction(callback)) {                                                                                 // 70
      callback(results);                                                                                          // 71
    }                                                                                                             // 72
                                                                                                                  // 73
    return results;                                                                                               // 74
  },                                                                                                              // 75
  /**                                                                                                             // 76
   * The default mongo-db query - selector used for searching.                                                    // 77
   *                                                                                                              // 78
   * @param {Object} conf                                                                                         // 79
   * @param {String} searchString                                                                                 // 80
   * @param {Function} regexCallback                                                                              // 81
   *                                                                                                              // 82
   * @returns {Object}                                                                                            // 83
   */                                                                                                             // 84
  'defaultQuery' : function (conf, searchString, regexCallback) {                                                 // 85
    if (Meteor.isServer) {                                                                                        // 86
      return { $text: { $search: searchString } };                                                                // 87
    } else if (Meteor.isClient) {                                                                                 // 88
      // Convert numbers if configured                                                                            // 89
      if (conf.convertNumbers && parseInt(searchString, 10) == searchString) {                                    // 90
        searchString = parseInt(searchString, 10);                                                                // 91
      }                                                                                                           // 92
                                                                                                                  // 93
      var stringSelector = { '$regex' : '.*' + searchString + '.*', '$options' : 'i'},                            // 94
        selector = {                                                                                              // 95
          $or: []                                                                                                 // 96
        };                                                                                                        // 97
                                                                                                                  // 98
      if (regexCallback) {                                                                                        // 99
        stringSelector['$regex'] = regexCallback(searchString);                                                   // 100
      }                                                                                                           // 101
                                                                                                                  // 102
      _.each(conf.field, function (fieldString) {                                                                 // 103
        var orSelector = {};                                                                                      // 104
                                                                                                                  // 105
        if (_.isString(searchString)) {                                                                           // 106
          orSelector[fieldString] = stringSelector;                                                               // 107
        } else if (_.isNumber(searchString)) {                                                                    // 108
          orSelector[fieldString] = searchString;                                                                 // 109
        }                                                                                                         // 110
                                                                                                                  // 111
        selector['$or'].push(orSelector);                                                                         // 112
      });                                                                                                         // 113
                                                                                                                  // 114
      return selector;                                                                                            // 115
    }                                                                                                             // 116
  },                                                                                                              // 117
  /**                                                                                                             // 118
   * The default mongo-db sorting method used for sorting the results.                                            // 119
   *                                                                                                              // 120
   * @param {Object} conf                                                                                         // 121
   * @return array                                                                                                // 122
   */                                                                                                             // 123
  'defaultSort' : function (conf) {                                                                               // 124
    return conf.field;                                                                                            // 125
  }                                                                                                               // 126
};                                                                                                                // 127
                                                                                                                  // 128
if (Meteor.isClient) {                                                                                            // 129
  EasySearch.createSearcher('minimongo', methods);                                                                // 130
} else if (Meteor.isServer) {                                                                                     // 131
  EasySearch.createSearcher('mongo-db', methods);                                                                 // 132
}                                                                                                                 // 133
                                                                                                                  // 134
                                                                                                                  // 135
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem:easy-search/lib/easy-search-server.js                                                       //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
'use strict';                                                                                                     // 1
var ElasticSearch = Npm.require('elasticsearch');                                                                 // 2
                                                                                                                  // 3
EasySearch._esDefaultConfig = {                                                                                   // 4
  host : 'localhost:9200'                                                                                         // 5
};                                                                                                                // 6
                                                                                                                  // 7
/**                                                                                                               // 8
 * Override the config for Elastic Search.                                                                        // 9
 *                                                                                                                // 10
 * @param {object} newConfig                                                                                      // 11
 */                                                                                                               // 12
EasySearch.config = function (newConfig) {                                                                        // 13
  if ("undefined" !== typeof newConfig) {                                                                         // 14
    check(newConfig, Object);                                                                                     // 15
    this._config = _.extend(this._esDefaultConfig, newConfig);                                                    // 16
    this.ElasticSearchClient = new ElasticSearch.Client(this._config);                                            // 17
  }                                                                                                               // 18
                                                                                                                  // 19
  return this._config;                                                                                            // 20
};                                                                                                                // 21
                                                                                                                  // 22
/**                                                                                                               // 23
 * Get the ElasticSearchClient                                                                                    // 24
 * @see http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current                         // 25
 *                                                                                                                // 26
 * @return {ElasticSearch.Client}                                                                                 // 27
 */                                                                                                               // 28
EasySearch.getElasticSearchClient = function () {                                                                 // 29
  return this.ElasticSearchClient;                                                                                // 30
};                                                                                                                // 31
                                                                                                                  // 32
/**                                                                                                               // 33
 * Transforms the field definition to a MongoDB index doc definition.                                             // 34
 *                                                                                                                // 35
 * @param {Array} fields                                                                                          // 36
 *                                                                                                                // 37
 * @returns {Object}                                                                                              // 38
 */                                                                                                               // 39
EasySearch._transformFieldsToIndexDocument = function (fields) {                                                  // 40
  var indexDoc = {};                                                                                              // 41
                                                                                                                  // 42
  _.each(fields, function (field) {                                                                               // 43
    indexDoc[field] = 'text';                                                                                     // 44
  });                                                                                                             // 45
                                                                                                                  // 46
  return indexDoc;                                                                                                // 47
};                                                                                                                // 48
                                                                                                                  // 49
Meteor.methods({                                                                                                  // 50
  /**                                                                                                             // 51
   * Make server side search possible on the client.                                                              // 52
   *                                                                                                              // 53
   * @param {String} name                                                                                         // 54
   * @param {String} searchString                                                                                 // 55
   * @param {Object} options                                                                                      // 56
   */                                                                                                             // 57
  easySearch: function (name, searchString, options) {                                                            // 58
    check(name, String);                                                                                          // 59
    check(searchString, String);                                                                                  // 60
    check(options, Object);                                                                                       // 61
    return EasySearch.search(name, searchString, options);                                                        // 62
  }                                                                                                               // 63
});                                                                                                               // 64
                                                                                                                  // 65
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem:easy-search/lib/searchers/elastic-search.js                                                 //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
'use strict';                                                                                                     // 1
                                                                                                                  // 2
var Future = Npm.require('fibers/future'),                                                                        // 3
  ElasticSearch = Npm.require('elasticsearch');                                                                   // 4
                                                                                                                  // 5
/**                                                                                                               // 6
 * Return Elastic Search indexable data.                                                                          // 7
 *                                                                                                                // 8
 * @param {Object} doc the document to get the values from                                                        // 9
 * @return {Object}                                                                                               // 10
 */                                                                                                               // 11
function getESFields(doc) {                                                                                       // 12
  var newDoc = {};                                                                                                // 13
                                                                                                                  // 14
  _.each(doc, function (value, key) {                                                                             // 15
    newDoc[key] = _.isObject(value) && !_.isArray(value) && !_.isDate(value) ? JSON.stringify(value) : value;     // 16
  });                                                                                                             // 17
                                                                                                                  // 18
  return newDoc;                                                                                                  // 19
}                                                                                                                 // 20
                                                                                                                  // 21
EasySearch.createSearcher('elastic-search', {                                                                     // 22
  /**                                                                                                             // 23
   * Write a document to a specified index.                                                                       // 24
   *                                                                                                              // 25
   * @param {String} name                                                                                         // 26
   * @param {Object} doc                                                                                          // 27
   * @param {String} id                                                                                           // 28
   * @param {Object} opts                                                                                         // 29
   * @param {Object} config                                                                                       // 30
   */                                                                                                             // 31
  'writeToIndex' : function (name, doc, id, opts, config) {                                                       // 32
    var debugMode = config.debug,                                                                                 // 33
        transformedDoc = opts.transform(doc);                                                                     // 34
                                                                                                                  // 35
    if (_.isObject(transformedDoc)) {                                                                             // 36
      doc = transformedDoc;                                                                                       // 37
    }                                                                                                             // 38
                                                                                                                  // 39
    // add to index                                                                                               // 40
    EasySearch.ElasticSearchClient.index({                                                                        // 41
      index : name.toLowerCase(),                                                                                 // 42
      type : 'default',                                                                                           // 43
      id : id,                                                                                                    // 44
      body : doc                                                                                                  // 45
    }, function (err, data) {                                                                                     // 46
      if (err) {                                                                                                  // 47
        console.log('Had error adding a document!');                                                              // 48
        console.log(err);                                                                                         // 49
      }                                                                                                           // 50
                                                                                                                  // 51
      if (debugMode && console) {                                                                                 // 52
        console.log('EasySearch: Added / Replaced document to Elastic Search:');                                  // 53
        console.log('EasySearch: ' + data + "\n");                                                                // 54
      }                                                                                                           // 55
    });                                                                                                           // 56
  },                                                                                                              // 57
  /**                                                                                                             // 58
   * Setup some observers on the mongo db collection provided.                                                    // 59
   *                                                                                                              // 60
   * @param {String} name                                                                                         // 61
   * @param {Object} options                                                                                      // 62
   */                                                                                                             // 63
  'createSearchIndex' : function (name, options) {                                                                // 64
    var searcherScope = this,                                                                                     // 65
      config = EasySearch.config() || {};                                                                         // 66
                                                                                                                  // 67
    if ("undefined" === typeof EasySearch.ElasticSearchClient) {                                                  // 68
      EasySearch.ElasticSearchClient = new ElasticSearch.Client(this._esDefaultConfig);                           // 69
    }                                                                                                             // 70
                                                                                                                  // 71
    name = name.toLowerCase();                                                                                    // 72
                                                                                                                  // 73
    options.collection.find().observeChanges({                                                                    // 74
      added: function (id, fields) {                                                                              // 75
        searcherScope.writeToIndex(name, getESFields(fields), id, options, config);                               // 76
      },                                                                                                          // 77
      changed: function (id) {                                                                                    // 78
        // Overwrites the current document with the new doc                                                       // 79
        searcherScope.writeToIndex(name, getESFields(options.collection.findOne(id)), id, options, config);       // 80
      },                                                                                                          // 81
      removed: function (id) {                                                                                    // 82
        EasySearch.ElasticSearchClient.delete({                                                                   // 83
          index: name,                                                                                            // 84
          type: 'default',                                                                                        // 85
          id: id                                                                                                  // 86
        }, function (error, response) {                                                                           // 87
          if (config.debug) {                                                                                     // 88
            console.log('Removed document with id ( ' +  id + ' )!');                                             // 89
          }                                                                                                       // 90
        });                                                                                                       // 91
      }                                                                                                           // 92
    });                                                                                                           // 93
  },                                                                                                              // 94
  /**                                                                                                             // 95
   * Get the data out of the JSON elastic search response.                                                        // 96
   *                                                                                                              // 97
   * @param {Object} data                                                                                         // 98
   * @returns {Array}                                                                                             // 99
   */                                                                                                             // 100
  'extractJSONData' : function (data) {                                                                           // 101
    data = _.isString(data) ? JSON.parse(data) : data;                                                            // 102
                                                                                                                  // 103
    var results = _.map(data.hits.hits, function (resultSet) {                                                    // 104
      var field = '_source';                                                                                      // 105
                                                                                                                  // 106
      if (resultSet['fields']) {                                                                                  // 107
        field = 'fields';                                                                                         // 108
      }                                                                                                           // 109
                                                                                                                  // 110
      resultSet[field]['_id'] = resultSet['_id'];                                                                 // 111
      return resultSet[field];                                                                                    // 112
    });                                                                                                           // 113
                                                                                                                  // 114
    return {                                                                                                      // 115
      'results' : results,                                                                                        // 116
      'total' : data.hits.total                                                                                   // 117
    };                                                                                                            // 118
  },                                                                                                              // 119
  /**                                                                                                             // 120
   * Perform a search with Elastic Search, using fibers.                                                          // 121
   *                                                                                                              // 122
   * @param {String} name                                                                                         // 123
   * @param {String} searchString                                                                                 // 124
   * @param {Object} options                                                                                      // 125
   * @param {Function} callback                                                                                   // 126
   * @returns {*}                                                                                                 // 127
   */                                                                                                             // 128
  'search' : function (name, searchString, options, callback) {                                                   // 129
    var bodyObj,                                                                                                  // 130
      that = this,                                                                                                // 131
      fut = new Future(),                                                                                         // 132
      index = EasySearch.getIndex(name);                                                                          // 133
                                                                                                                  // 134
    if (!_.isObject(index)) {                                                                                     // 135
      return;                                                                                                     // 136
    }                                                                                                             // 137
                                                                                                                  // 138
    bodyObj = {                                                                                                   // 139
      "query" : index.query(searchString, options)                                                                // 140
    };                                                                                                            // 141
                                                                                                                  // 142
    if (!bodyObj.query) {                                                                                         // 143
      return { total: 0, results: [] };                                                                           // 144
    }                                                                                                             // 145
                                                                                                                  // 146
    bodyObj.sort = index.sort(searchString, options);                                                             // 147
                                                                                                                  // 148
    if (options.returnFields) {                                                                                   // 149
      if (options.returnFields.indexOf('_id') === -1 ) {                                                          // 150
        options.returnFields.push('_id');                                                                         // 151
      }                                                                                                           // 152
                                                                                                                  // 153
      bodyObj.fields = options.returnFields;                                                                      // 154
    }                                                                                                             // 155
                                                                                                                  // 156
    // Modify Elastic Search body if wished                                                                       // 157
    if (index.body && _.isFunction(index.body)) {                                                                 // 158
      bodyObj = index.body(bodyObj, options);                                                                     // 159
    }                                                                                                             // 160
                                                                                                                  // 161
    name = name.toLowerCase();                                                                                    // 162
                                                                                                                  // 163
    if ("function" === typeof callback) {                                                                         // 164
      EasySearch.ElasticSearchClient.search(name, bodyObj, callback);                                             // 165
      return;                                                                                                     // 166
    }                                                                                                             // 167
                                                                                                                  // 168
    // Most likely client call, return data set                                                                   // 169
    EasySearch.ElasticSearchClient.search({                                                                       // 170
      index : name,                                                                                               // 171
      body : bodyObj,                                                                                             // 172
      size : options.limit,                                                                                       // 173
      from: options.skip                                                                                          // 174
    }, function (error, data) {                                                                                   // 175
      if (error) {                                                                                                // 176
        console.log('Had an error while searching!');                                                             // 177
        console.log(error);                                                                                       // 178
        return;                                                                                                   // 179
      }                                                                                                           // 180
                                                                                                                  // 181
      if ("raw" !== index.format) {                                                                               // 182
        data = that.extractJSONData(data);                                                                        // 183
      }                                                                                                           // 184
                                                                                                                  // 185
      fut['return'](data);                                                                                        // 186
    });                                                                                                           // 187
                                                                                                                  // 188
    return fut.wait();                                                                                            // 189
  },                                                                                                              // 190
  /**                                                                                                             // 191
   * The default ES query object used for searching the results.                                                  // 192
   *                                                                                                              // 193
   * @param {Object} options                                                                                      // 194
   * @param {String} searchString                                                                                 // 195
   * @return array                                                                                                // 196
   */                                                                                                             // 197
  'defaultQuery' : function (options, searchString) {                                                             // 198
    return {                                                                                                      // 199
      "fuzzy_like_this" : {                                                                                       // 200
        "fields" : options.field,                                                                                 // 201
        "like_text" : searchString                                                                                // 202
      }                                                                                                           // 203
    };                                                                                                            // 204
  },                                                                                                              // 205
  /**                                                                                                             // 206
   * The default ES sorting method used for sorting the results.                                                  // 207
   *                                                                                                              // 208
   * @param {Object} options                                                                                      // 209
   * @return array                                                                                                // 210
   */                                                                                                             // 211
  'defaultSort' : function (options) {                                                                            // 212
    return options.field;                                                                                         // 213
  }                                                                                                               // 214
});                                                                                                               // 215
                                                                                                                  // 216
// Expose ElasticSearch API                                                                                       // 217
EasySearch.ElasticSearch = ElasticSearch;                                                                         // 218
                                                                                                                  // 219
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['matteodem:easy-search'] = {
  EasySearch: EasySearch
};

})();

//# sourceMappingURL=matteodem_easy-search.js.map
