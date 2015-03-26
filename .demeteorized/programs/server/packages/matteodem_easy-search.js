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
     * @param {Object} selector                                                                                   // 130
     * @param {Object} options                                                                                    // 131
     * @returns {MongoCursor}                                                                                     // 132
     */                                                                                                           // 133
    defaultOptions.find = function (selector, options) {                                                          // 134
      selector = selector || {};                                                                                  // 135
      selector._index = this.name;                                                                                // 136
                                                                                                                  // 137
      if (this.collection._transform) {                                                                           // 138
        options.transform = extendTransformFunction(this.collection, options.transform);                          // 139
      }                                                                                                           // 140
                                                                                                                  // 141
      return ESSearchResults.find(selector, options);                                                             // 142
    };                                                                                                            // 143
                                                                                                                  // 144
    /**                                                                                                           // 145
     * findOne method to let users interact with search results.                                                  // 146
     * @param {Object} selector                                                                                   // 147
     * @param {Object} options                                                                                    // 148
     * @returns {Document}                                                                                        // 149
     */                                                                                                           // 150
    defaultOptions.findOne = function (selector, options) {                                                       // 151
      if (_.isObject(selector) || !selector) {                                                                    // 152
        selector = selector || {};                                                                                // 153
        selector._index = this.name;                                                                              // 154
      }                                                                                                           // 155
                                                                                                                  // 156
      if (this.collection._transform) {                                                                           // 157
        options.transform = extendTransformFunction(this.collection, options.transform);                          // 158
      }                                                                                                           // 159
                                                                                                                  // 160
      return ESSearchResults.findOne(selector, options);                                                          // 161
    };                                                                                                            // 162
  }                                                                                                               // 163
                                                                                                                  // 164
                                                                                                                  // 165
  /**                                                                                                             // 166
   * Searchers contains all engines that can be used to search content, until now:                                // 167
   *                                                                                                              // 168
   * minimongo (client): Client side collection for reactive search                                               // 169
   * elastic-search (server): Elastic search server to search with (fast)                                         // 170
   * mongo-db (server): MongoDB on the server to search (more convenient)                                         // 171
   *                                                                                                              // 172
   */                                                                                                             // 173
  Searchers = {};                                                                                                 // 174
                                                                                                                  // 175
  return {                                                                                                        // 176
    /**                                                                                                           // 177
     * Placeholder config method.                                                                                 // 178
     *                                                                                                            // 179
     * @param {Object} newConfig                                                                                  // 180
     */                                                                                                           // 181
    'config' : function (newConfig) {                                                                             // 182
      return {};                                                                                                  // 183
    },                                                                                                            // 184
    /**                                                                                                           // 185
     * Simple logging method.                                                                                     // 186
     *                                                                                                            // 187
     * @param {String} message                                                                                    // 188
     * @param {String} type                                                                                       // 189
     */                                                                                                           // 190
    'log' : function (message, type) {                                                                            // 191
      type = type || 'log';                                                                                       // 192
                                                                                                                  // 193
      if (console && _.isFunction(console[type])) {                                                               // 194
        return console[type](message);                                                                            // 195
      } else if (console && _.isFunction(console.log)) {                                                          // 196
        return console.log(message);                                                                              // 197
      }                                                                                                           // 198
    },                                                                                                            // 199
    /**                                                                                                           // 200
     * Create a search index.                                                                                     // 201
     *                                                                                                            // 202
     * @param {String} name                                                                                       // 203
     * @param {Object} options                                                                                    // 204
     */                                                                                                           // 205
    'createSearchIndex' : function (name, options) {                                                              // 206
      check(name, Match.OneOf(String, null));                                                                     // 207
      check(options, Object);                                                                                     // 208
                                                                                                                  // 209
      options.name = name;                                                                                        // 210
      options.field = _.isArray(options.field) ? options.field : [options.field];                                 // 211
      indexes[name] = _.extend(_.clone(defaultOptions), options);                                                 // 212
                                                                                                                  // 213
      options = indexes[name];                                                                                    // 214
                                                                                                                  // 215
      if (options.permission) {                                                                                   // 216
        EasySearch.log(                                                                                           // 217
            'permission property is now deprecated! Return false inside a custom query method instead',           // 218
            'warn'                                                                                                // 219
        );                                                                                                        // 220
      }                                                                                                           // 221
                                                                                                                  // 222
      if (Meteor.isServer && EasySearch._usesSubscriptions(name)) {                                               // 223
        setUpPublication(name, indexes[name]);                                                                    // 224
      }                                                                                                           // 225
                                                                                                                  // 226
      Searchers[options.use] && Searchers[options.use].createSearchIndex(name, options);                          // 227
    },                                                                                                            // 228
    /**                                                                                                           // 229
     * Perform a search.                                                                                          // 230
     *                                                                                                            // 231
     * @param {String} name             the search index                                                          // 232
     * @param {String} searchString     the string to be searched                                                 // 233
     * @param {Object} options          defined with createSearchIndex                                            // 234
     * @param {Function} callback       optional callback to be used                                              // 235
     */                                                                                                           // 236
    'search' : function (name, searchString, options, callback) {                                                 // 237
      var results,                                                                                                // 238
        index = indexes[name],                                                                                    // 239
        searcherType = index.use;                                                                                 // 240
                                                                                                                  // 241
      check(name, String);                                                                                        // 242
      check(searchString, String);                                                                                // 243
      check(options, Object);                                                                                     // 244
      check(callback, Match.Optional(Function));                                                                  // 245
                                                                                                                  // 246
      if ("undefined" === typeof Searchers[searcherType]) {                                                       // 247
        throw new Meteor.Error(500, "Couldnt search with type: '" + searcherType + "'");                          // 248
      }                                                                                                           // 249
                                                                                                                  // 250
      results = Searchers[searcherType].search(name, searchString, _.extend(indexes[name], options), callback);   // 251
                                                                                                                  // 252
      return index.changeResults(results);                                                                        // 253
    },                                                                                                            // 254
    /**                                                                                                           // 255
     * Retrieve a specific index configuration.                                                                   // 256
     *                                                                                                            // 257
     * @param {String} name                                                                                       // 258
     * @return {Object}                                                                                           // 259
     * @api public                                                                                                // 260
     */                                                                                                           // 261
    'getIndex' : function (name) {                                                                                // 262
      return indexes[name];                                                                                       // 263
    },                                                                                                            // 264
    /**                                                                                                           // 265
     * Retrieve all index configurations                                                                          // 266
     */                                                                                                           // 267
    'getIndexes' : function () {                                                                                  // 268
      return indexes;                                                                                             // 269
    },                                                                                                            // 270
    /**                                                                                                           // 271
     * Retrieve a specific Seacher.                                                                               // 272
     *                                                                                                            // 273
     * @param {String} name                                                                                       // 274
     * @return {Object}                                                                                           // 275
     * @api public                                                                                                // 276
     */                                                                                                           // 277
    'getSearcher' : function (name) {                                                                             // 278
      return Searchers[name];                                                                                     // 279
    },                                                                                                            // 280
    /**                                                                                                           // 281
     * Retrieve all Searchers.                                                                                    // 282
     */                                                                                                           // 283
    'getSearchers' : function () {                                                                                // 284
      return Searchers;                                                                                           // 285
    },                                                                                                            // 286
    /**                                                                                                           // 287
     * Loop through the indexes and provide the configuration.                                                    // 288
     *                                                                                                            // 289
     * @param {Array|String} indexes                                                                              // 290
     * @param callback                                                                                            // 291
     */                                                                                                           // 292
    'eachIndex' : function (indexes, callback) {                                                                  // 293
      indexes = !_.isArray(indexes) ? [indexes] : indexes;                                                        // 294
                                                                                                                  // 295
      _.each(indexes, function (index) {                                                                          // 296
        callback(index, EasySearch.getIndex(index));                                                              // 297
      });                                                                                                         // 298
    },                                                                                                            // 299
    /**                                                                                                           // 300
     * Makes it possible to override or extend the different                                                      // 301
     * types of search to use with EasySearch (the "use" property)                                                // 302
     * when using EasySearch.createSearchIndex()                                                                  // 303
     *                                                                                                            // 304
     * @param {String} key      Type, e.g. mongo-db, elastic-search                                               // 305
     * @param {Object} methods  Methods to be used, only 2 are required:                                          // 306
     *                          - createSearchIndex (name, options)                                               // 307
     *                          - search (name, searchString, [options, callback])                                // 308
     *                          - defaultQuery (options, searchString)                                            // 309
     *                          - defaultSort (options)                                                           // 310
     */                                                                                                           // 311
    'createSearcher' : function (key, methods) {                                                                  // 312
      check(key, String);                                                                                         // 313
      check(methods.search, Function);                                                                            // 314
      check(methods.createSearchIndex, Function);                                                                 // 315
                                                                                                                  // 316
      Searchers[key] = methods;                                                                                   // 317
    },                                                                                                            // 318
    /**                                                                                                           // 319
     * Helper to check if searcher uses server side subscriptions for searching.                                  // 320
     *                                                                                                            // 321
     * @param {String} index Index name to check configuration for                                                // 322
     */                                                                                                           // 323
    '_usesSubscriptions' : function (index) {                                                                     // 324
      var conf = EasySearch.getIndex(index);                                                                      // 325
      return conf && conf.reactive && conf.use !== 'minimongo';                                                   // 326
    },                                                                                                            // 327
    /**                                                                                                           // 328
     * Helper to transform an array of fields to Meteor "Field Specifiers"                                        // 329
     *                                                                                                            // 330
     * @param {Array} fields Array of fields                                                                      // 331
     */                                                                                                           // 332
    '_transformToFieldSpecifiers' : function (fields) {                                                           // 333
      var specifiers = {};                                                                                        // 334
                                                                                                                  // 335
      _.each(fields, function (field) {                                                                           // 336
        specifiers[field] = 1;                                                                                    // 337
      });                                                                                                         // 338
                                                                                                                  // 339
      return specifiers;                                                                                          // 340
    }                                                                                                             // 341
  };                                                                                                              // 342
})();                                                                                                             // 343
                                                                                                                  // 344
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
  'createSearchIndex' : function (name, options) {},                                                              // 9
  /**                                                                                                             // 10
   *                                                                                                              // 11
   * Perform a really simple search with mongo db.                                                                // 12
   *                                                                                                              // 13
   * @param {String} name                                                                                         // 14
   * @param {String} searchString                                                                                 // 15
   * @param {Object} options                                                                                      // 16
   * @param {Function} callback                                                                                   // 17
   * @returns {Object}                                                                                            // 18
   */                                                                                                             // 19
  'search' : function (name, searchString, options, callback) {                                                   // 20
    var cursor,                                                                                                   // 21
      results,                                                                                                    // 22
      selector,                                                                                                   // 23
      cursorOptions,                                                                                              // 24
      index = EasySearch.getIndex(name);                                                                          // 25
                                                                                                                  // 26
    if (!_.isObject(index)) {                                                                                     // 27
      return;                                                                                                     // 28
    }                                                                                                             // 29
                                                                                                                  // 30
    options.limit = options.limit || 10;                                                                          // 31
                                                                                                                  // 32
    // if several, fields do an $or search, otherwise only over the field                                         // 33
    selector = index.query(searchString, options);                                                                // 34
                                                                                                                  // 35
    if (!selector) {                                                                                              // 36
      return { total: 0, results: [] };                                                                           // 37
    }                                                                                                             // 38
                                                                                                                  // 39
    cursorOptions = {                                                                                             // 40
      sort : index.sort(searchString, options)                                                                    // 41
    };                                                                                                            // 42
                                                                                                                  // 43
    if (options.returnFields) {                                                                                   // 44
      cursorOptions.fields = EasySearch._transformToFieldSpecifiers(options.returnFields);                        // 45
    }                                                                                                             // 46
                                                                                                                  // 47
    if (options.skip) {                                                                                           // 48
      cursorOptions.skip = options.skip;                                                                          // 49
    }                                                                                                             // 50
                                                                                                                  // 51
    cursor = index.collection.find(selector, cursorOptions);                                                      // 52
                                                                                                                  // 53
    results = {                                                                                                   // 54
      'results' : _.first(cursor.fetch(), options.limit),                                                         // 55
      'total' : cursor.count()                                                                                    // 56
    };                                                                                                            // 57
                                                                                                                  // 58
    if (_.isFunction(callback)) {                                                                                 // 59
      callback(results);                                                                                          // 60
    }                                                                                                             // 61
                                                                                                                  // 62
    return results;                                                                                               // 63
  },                                                                                                              // 64
  /**                                                                                                             // 65
   * The default mongo-db query - selector used for searching.                                                    // 66
   *                                                                                                              // 67
   * @param {Object} conf                                                                                         // 68
   * @param {String} searchString                                                                                 // 69
   * @param {Function} regexCallback                                                                              // 70
   *                                                                                                              // 71
   * @returns {Object}                                                                                            // 72
   */                                                                                                             // 73
  'defaultQuery' : function (conf, searchString, regexCallback) {                                                 // 74
    var orSelector,                                                                                               // 75
      selector = {},                                                                                              // 76
      field = conf.field,                                                                                         // 77
      stringSelector = { '$regex' : '.*' + searchString + '.*', '$options' : 'i' };                               // 78
                                                                                                                  // 79
    if (_.isString(field)) {                                                                                      // 80
      selector[field] = stringSelector;                                                                           // 81
      return selector;                                                                                            // 82
    }                                                                                                             // 83
                                                                                                                  // 84
    // Convert numbers if configured                                                                              // 85
    if (conf.convertNumbers && parseInt(searchString, 10) == searchString) {                                      // 86
      searchString = parseInt(searchString, 10);                                                                  // 87
    }                                                                                                             // 88
                                                                                                                  // 89
    if (regexCallback) {                                                                                          // 90
      stringSelector['$regex'] = regexCallback(searchString);                                                     // 91
    }                                                                                                             // 92
                                                                                                                  // 93
    // Should be an array                                                                                         // 94
    selector['$or'] = [];                                                                                         // 95
                                                                                                                  // 96
    _.each(field, function (fieldString) {                                                                        // 97
      orSelector = {};                                                                                            // 98
                                                                                                                  // 99
      if (_.isString(searchString)) {                                                                             // 100
        orSelector[fieldString] = stringSelector;                                                                 // 101
      } else if (_.isNumber(searchString)) {                                                                      // 102
        orSelector[fieldString] = searchString;                                                                   // 103
      }                                                                                                           // 104
                                                                                                                  // 105
      selector['$or'].push(orSelector);                                                                           // 106
    });                                                                                                           // 107
                                                                                                                  // 108
    return selector;                                                                                              // 109
  },                                                                                                              // 110
  /**                                                                                                             // 111
   * The default mongo-db sorting method used for sorting the results.                                            // 112
   *                                                                                                              // 113
   * @param {Object} conf                                                                                         // 114
   * @return array                                                                                                // 115
   */                                                                                                             // 116
  'defaultSort' : function (conf) {                                                                               // 117
    return conf.field;                                                                                            // 118
  }                                                                                                               // 119
};                                                                                                                // 120
                                                                                                                  // 121
if (Meteor.isClient) {                                                                                            // 122
  EasySearch.createSearcher('minimongo', methods);                                                                // 123
} else if (Meteor.isServer) {                                                                                     // 124
  EasySearch.createSearcher('mongo-db', methods);                                                                 // 125
}                                                                                                                 // 126
                                                                                                                  // 127
                                                                                                                  // 128
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
Meteor.methods({                                                                                                  // 33
  /**                                                                                                             // 34
   * Make server side search possible on the client.                                                              // 35
   *                                                                                                              // 36
   * @param {String} name                                                                                         // 37
   * @param {String} searchString                                                                                 // 38
   * @param {Object} options                                                                                      // 39
   */                                                                                                             // 40
  easySearch: function (name, searchString, options) {                                                            // 41
    check(name, String);                                                                                          // 42
    check(searchString, String);                                                                                  // 43
    check(options, Object);                                                                                       // 44
    return EasySearch.search(name, searchString, options);                                                        // 45
  }                                                                                                               // 46
});                                                                                                               // 47
                                                                                                                  // 48
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
    newDoc[key] = _.isObject(value) && !_.isArray(value) ? JSON.stringify(value) : value;                         // 16
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
