(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var WebApp = Package.webapp.WebApp;
var main = Package.webapp.main;
var WebAppInternals = Package.webapp.WebAppInternals;

/* Package-scope variables */
var RssFeed, rssurl, feedName, Fiber, fileHandler;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/lampe:rssfeed/rss.server.js                                                                    //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/*                                                                                                         // 1
* meteor-rssfeed — This package publishes data as rss feeds, it takes params and listens on the url "/rss" // 2
*/                                                                                                         // 3
                                                                                                           // 4
// Polyfill                                                                                                // 5
if(!Array.isArray) {                                                                                       // 6
  Array.isArray = function (vArg) {                                                                        // 7
    return Object.prototype.toString.call(vArg) === '[object Array]';                                      // 8
  };                                                                                                       // 9
}                                                                                                          // 10
                                                                                                           // 11
var url = Npm.require('url');                                                                              // 12
                                                                                                           // 13
var feedHandlers = {};                                                                                     // 14
                                                                                                           // 15
var nameFollowsConventions = function(name) {                                                              // 16
  // TODO: Expand check to follow URI name specs or test name to follow                                    // 17
  // Meteor.Collection naming convention                                                                   // 18
  return name === '' + name;                                                                               // 19
};                                                                                                         // 20
                                                                                                           // 21
RssFeed = {                                                                                                // 22
  publish: function(name, handlerFunction) {                                                               // 23
    if (!nameFollowsConventions(name)) {                                                                   // 24
      throw new Error('RssFeed publish expects valid name to be of type String');                          // 25
    }                                                                                                      // 26
    // Check if the handlerFunction is actually a function                                                 // 27
    if (typeof handlerFunction !== 'function') {                                                           // 28
      throw new Error('RssFeed publish expects feed handler as a function');                               // 29
    }                                                                                                      // 30
                                                                                                           // 31
    // Add the handler function to feedHandlers                                                            // 32
    feedHandlers[name] = handlerFunction;                                                                  // 33
  },                                                                                                       // 34
  unpublish: function(name) {                                                                              // 35
    if (!nameFollowsConventions(name)) {                                                                   // 36
      throw new Error('RssFeed unpublish expects valid name to be of type String');                        // 37
    }                                                                                                      // 38
    // We could do a check to se if the name is allready found, if not then                                // 39
    // throw an error, but for now we are silent                                                           // 40
    delete feedHandlers[name];                                                                             // 41
  },                                                                                                       // 42
  createTag: function(key, value) {                                                                        // 43
    if (typeof key === 'undefined') {                                                                      // 44
      return value;                                                                                        // 45
    }                                                                                                      // 46
                                                                                                           // 47
    return '<' + key + '>' + value + '</' + key + '>';                                                     // 48
  },                                                                                                       // 49
  cdataValue: function(value) {                                                                            // 50
    return '<![CDATA[' + value + ']]>';                                                                    // 51
  },                                                                                                       // 52
  objectToXML: function(sourceObject) {                                                                    // 53
    // The returning string                                                                                // 54
    var result = '';                                                                                       // 55
                                                                                                           // 56
    // We do a one level iteration of the object                                                           // 57
    for (var key in sourceObject) {                                                                        // 58
      if (sourceObject.hasOwnProperty(key)) {                                                              // 59
        var value = sourceObject[key];                                                                     // 60
        // We create <key>value</key>                                                                      // 61
        if (typeof value === 'object') {                                                                   // 62
          // If date                                                                                       // 63
          if (value instanceof Date) {                                                                     // 64
            // We extract the date into correct format                                                     // 65
            // If Date we produce the formatted date Mon, 06 Sep 2009 16:20:00 +0000                       // 66
            result += this.createTag(key, value.toUTCString());                                            // 67
          } else {                                                                                         // 68
            if (Array.isArray(value)) {                                                                    // 69
              // If array we repeat the tag n times with values?                                           // 70
              for (var i = 0; i < value.length; i++) {                                                     // 71
                result += this.createTag(key, this.objectToXML(value[i]));                                 // 72
              }                                                                                            // 73
            } else {                                                                                       // 74
              // If objects we do nothing - one could create nested xml?                                   // 75
              result += this.createTag(key, this.objectToXML(value));                                      // 76
            }                                                                                              // 77
          }                                                                                                // 78
                                                                                                           // 79
        } else {                                                                                           // 80
          if (typeof value === 'function') {                                                               // 81
            // Should we execute the function and return the value into tag?                               // 82
            value = value();                                                                               // 83
          }                                                                                                // 84
          // But if text then incapsulate in <![CDATA[ ]]>                                                 // 85
          result += this.createTag(key, value);                                                            // 86
        }                                                                                                  // 87
      }                                                                                                    // 88
    }                                                                                                      // 89
                                                                                                           // 90
    return result;                                                                                         // 91
  }                                                                                                        // 92
};                                                                                                         // 93
                                                                                                           // 94
// Handle the actual connection                                                                            // 95
WebApp.connectHandlers.use(function(req, res, next) {                                                      // 96
  rssurl = /^\/rss/gi;                                                                                     // 97
                                                                                                           // 98
  if (!rssurl.test(req.url)) {                                                                             // 99
    return next();                                                                                         // 100
  }                                                                                                        // 101
                                                                                                           // 102
  var parsed = url.parse(req.url, true);                                                                   // 103
  var folders = parsed.pathname.split('/');                                                                // 104
                                                                                                           // 105
  feedName = folders[2];                                                                                   // 106
                                                                                                           // 107
  // If feedHandler not found or somehow the feedhandler is not a function then                            // 108
  // return a 404                                                                                          // 109
  if (!feedHandlers[feedName] || typeof feedHandlers[feedName] !== 'function') {                           // 110
    res.writeHead(404);                                                                                    // 111
    res.end();                                                                                             // 112
    return;                                                                                                // 113
  }                                                                                                        // 114
                                                                                                           // 115
  var self = {                                                                                             // 116
    query: parsed.query,                                                                                   // 117
    res: res                                                                                               // 118
  };                                                                                                       // 119
                                                                                                           // 120
  // Helper functions this scope                                                                           // 121
  Fiber = Npm.require('fibers');                                                                           // 122
  fileHandler = Fiber(function(self) {                                                                     // 123
    // We fetch feed data from feedHandler, the handler uses the this.addItem()                            // 124
    // function to populate the feed, this way we have better check control and                            // 125
    // better error handling + messages                                                                    // 126
                                                                                                           // 127
    var feedObject = {                                                                                     // 128
      channel: {                                                                                           // 129
        title:'',                                                                                          // 130
        description:'',                                                                                    // 131
        link: '',                                                                                          // 132
        lastBuildDate: '',                                                                                 // 133
        pubDate: '',                                                                                       // 134
        ttl: '',                                                                                           // 135
        generator: 'Meteor RSS Feed',                                                                      // 136
        item: [] // title, description, link, guid, pubDate                                                // 137
      }                                                                                                    // 138
    };                                                                                                     // 139
                                                                                                           // 140
    var feedScope = {                                                                                      // 141
      cdata: RssFeed.cdataValue,                                                                           // 142
      setValue: function(key, value) {                                                                     // 143
        feedObject.channel[key] = value;                                                                   // 144
      },                                                                                                   // 145
      addItem: function(itemObject) {                                                                      // 146
        feedObject.channel.item.push(itemObject);                                                          // 147
      }                                                                                                    // 148
    };                                                                                                     // 149
                                                                                                           // 150
    feedHandlers[feedName].apply(feedScope, [self.query]);                                                 // 151
                                                                                                           // 152
    var feed = '<?xml version="1.0" encoding="UTF-8" ?>\n';                                                // 153
    feed += '<rss version="2.0">';                                                                         // 154
    feed += RssFeed.objectToXML(feedObject);                                                               // 155
    feed += '</rss>';                                                                                      // 156
                                                                                                           // 157
                                                                                                           // 158
    var feedBuffer = new Buffer(feed);                                                                     // 159
                                                                                                           // 160
    self.res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');                              // 161
    self.res.setHeader('Content-Length', feedBuffer.length);                                               // 162
    self.res.end(feedBuffer);                                                                              // 163
                                                                                                           // 164
  });                                                                                                      // 165
  // Run feed handler                                                                                      // 166
  try {                                                                                                    // 167
    fileHandler.run(self);                                                                                 // 168
  } catch(err) {                                                                                           // 169
    res.writeHead(404);                                                                                    // 170
    res.end();                                                                                             // 171
    throw new Error('Error in feed handler function, name ' + feedName + ' Error: ' + err.message);        // 172
  }                                                                                                        // 173
  return;                                                                                                  // 174
});                                                                                                        // 175
                                                                                                           // 176
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['lampe:rssfeed'] = {
  RssFeed: RssFeed
};

})();

//# sourceMappingURL=lampe_rssfeed.js.map
