(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Picker = Package['meteorhacks:picker'].Picker;

/* Package-scope variables */
var SearchSource;

(function () {

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
// packages/meteorhacks:search-source/lib/server.js                            //
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////
                                                                               //
SearchSource = {};                                                             // 1
SearchSource._sources = {};                                                    // 2
var bodyParser = Npm.require('body-parser');                                   // 3
                                                                               // 4
SearchSource.defineSource = function(name, callback) {                         // 5
  SearchSource._sources[name] = callback;                                      // 6
};                                                                             // 7
                                                                               // 8
Meteor.methods({                                                               // 9
  "search.source": function(name, query, options) {                            // 10
    check(name, String);                                                       // 11
    check(query, Match.OneOf(String, null, undefined));                        // 12
    check(options, Match.OneOf(Object, null, undefined));                      // 13
    this.unblock();                                                            // 14
                                                                               // 15
    // we need to send the context of the method                               // 16
    // that's why we use .call instead just invoking the function              // 17
    return getSourceData.call(this, name, query, options);                     // 18
  }                                                                            // 19
});                                                                            // 20
                                                                               // 21
var postRoutes = Picker.filter(function(req, res) {                            // 22
  return req.method == "POST";                                                 // 23
});                                                                            // 24
                                                                               // 25
postRoutes.middleware(bodyParser.text({                                        // 26
  type: "text/ejson"                                                           // 27
}));                                                                           // 28
                                                                               // 29
postRoutes.route('/_search-source', function(params, req, res, next) {         // 30
  if(req.body) {                                                               // 31
    var payload = EJSON.parse(req.body);                                       // 32
    try {                                                                      // 33
      // supporting the use of Meteor.userId()                                 // 34
      var data = DDP._CurrentInvocation.withValue({userId: null}, function() { // 35
        return getSourceData(payload.source, payload.query, payload.options);  // 36
      });                                                                      // 37
      sendData(res, null, data);                                               // 38
    } catch(ex) {                                                              // 39
      if(ex instanceof Meteor.Error) {                                         // 40
        var error = { code: ex.error, message: ex.reason };                    // 41
      } else {                                                                 // 42
        var error = { message: ex.message };                                   // 43
      }                                                                        // 44
      sendData(res, error);                                                    // 45
    }                                                                          // 46
  } else {                                                                     // 47
    next();                                                                    // 48
  }                                                                            // 49
});                                                                            // 50
                                                                               // 51
                                                                               // 52
function sendData(res, err, data) {                                            // 53
  var payload = {                                                              // 54
    error: err,                                                                // 55
    data: data                                                                 // 56
  };                                                                           // 57
                                                                               // 58
  res.end(EJSON.stringify(payload));                                           // 59
}                                                                              // 60
                                                                               // 61
function getSourceData(name, query, options) {                                 // 62
  var source = SearchSource._sources[name];                                    // 63
  if(source) {                                                                 // 64
    return source.call(this, query, options);                                  // 65
  } else {                                                                     // 66
    throw new Meteor.Error(404, "No such search source: " + name);             // 67
  }                                                                            // 68
}                                                                              // 69
/////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['meteorhacks:search-source'] = {
  SearchSource: SearchSource
};

})();

//# sourceMappingURL=meteorhacks_search-source.js.map
