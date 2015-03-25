(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/dfischer:prerenderio/dfischer:prerenderio.js                                                      //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
// Write your package code here!                                                                              // 1
                                                                                                              // 2
this.prerenderio = Npm.require('prerender-node');                                                             // 3
                                                                                                              // 4
if(typeof(Meteor.settings.PrerenderIO)=="object" && typeof(Meteor.settings.PrerenderIO.token)!="undefined") { // 5
  console.info('Prerender Token:',Meteor.settings.PrerenderIO.token);                                         // 6
  prerenderio.set('prerenderToken', Meteor.settings.PrerenderIO.token);                                       // 7
}                                                                                                             // 8
                                                                                                              // 9
var send = Npm.require('send');                                                                               // 10
var deprecate = Npm.require('depd')('express');                                                               // 11
                                                                                                              // 12
// adding in Npm.require('depd'); seems to be troublesome at this point..                                     // 13
var deprecate = function(msg) {                                                                               // 14
  return console.log(msg);                                                                                    // 15
};                                                                                                            // 16
                                                                                                              // 17
                                                                                                              // 18
Meteor.startup(function() {                                                                                   // 19
  WebApp.rawConnectHandlers.use(function(req, res, next) {                                                    // 20
                                                                                                              // 21
    req.get = function(param) {                                                                               // 22
      return req.headers[param.toLowerCase()];                                                                // 23
    };                                                                                                        // 24
                                                                                                              // 25
    res.req = req;                                                                                            // 26
                                                                                                              // 27
    res.status = function(code){                                                                              // 28
      this.statusCode = code;                                                                                 // 29
      return this;                                                                                            // 30
    };                                                                                                        // 31
                                                                                                              // 32
    res.set = res.header = function header(field, val) {                                                      // 33
      if (arguments.length === 2) {                                                                           // 34
        if (Array.isArray(val)) val = val.map(String);                                                        // 35
        else val = String(val);                                                                               // 36
        if ('content-type' == field.toLowerCase() && !/;\s*charset\s*=/.test(val)) {                          // 37
          var charset = send.mime.charsets.lookup(val.split(';')[0]);                                         // 38
          if (charset) val += '; charset=' + charset.toLowerCase();                                           // 39
        }                                                                                                     // 40
        this.setHeader(field, val);                                                                           // 41
      } else {                                                                                                // 42
        for (var key in field) {                                                                              // 43
          this.set(key, field[key]);                                                                          // 44
        }                                                                                                     // 45
      }                                                                                                       // 46
      return this;                                                                                            // 47
    };                                                                                                        // 48
                                                                                                              // 49
    res.get = function(field){                                                                                // 50
      return this.getHeader(field);                                                                           // 51
    };                                                                                                        // 52
                                                                                                              // 53
    res.send = function send(body) {                                                                          // 54
      var chunk = body;                                                                                       // 55
      var encoding;                                                                                           // 56
      var len;                                                                                                // 57
      var req = this.req;                                                                                     // 58
      var type;                                                                                               // 59
                                                                                                              // 60
      // settings                                                                                             // 61
      var app = this.app;                                                                                     // 62
                                                                                                              // 63
      // allow status / body                                                                                  // 64
      if (arguments.length === 2) {                                                                           // 65
        // res.send(body, status) backwards compat                                                            // 66
        if (typeof arguments[0] !== 'number' && typeof arguments[1] === 'number') {                           // 67
          deprecate('res.send(body, status): Use res.status(status).send(body) instead');                     // 68
          this.statusCode = arguments[1];                                                                     // 69
        } else {                                                                                              // 70
          deprecate('res.send(status, body): Use res.status(status).send(body) instead');                     // 71
          this.statusCode = arguments[0];                                                                     // 72
          chunk = arguments[1];                                                                               // 73
        }                                                                                                     // 74
      }                                                                                                       // 75
                                                                                                              // 76
      // disambiguate res.send(status) and res.send(status, num)                                              // 77
      if (typeof chunk === 'number' && arguments.length === 1) {                                              // 78
        // res.send(status) will set status message as text string                                            // 79
        if (!this.get('Content-Type')) {                                                                      // 80
          this.type('txt');                                                                                   // 81
        }                                                                                                     // 82
                                                                                                              // 83
        deprecate('res.send(status): Use res.sendStatus(status) instead');                                    // 84
        this.statusCode = chunk;                                                                              // 85
        chunk = http.STATUS_CODES[chunk];                                                                     // 86
      }                                                                                                       // 87
                                                                                                              // 88
      switch (typeof chunk) {                                                                                 // 89
        // string defaulting to html                                                                          // 90
        case 'string':                                                                                        // 91
          if (!this.get('Content-Type')) {                                                                    // 92
            this.type('html');                                                                                // 93
          }                                                                                                   // 94
          break;                                                                                              // 95
        case 'boolean':                                                                                       // 96
        case 'number':                                                                                        // 97
        case 'object':                                                                                        // 98
          if (chunk === null) {                                                                               // 99
            chunk = '';                                                                                       // 100
          } else if (Buffer.isBuffer(chunk)) {                                                                // 101
            if (!this.get('Content-Type')) {                                                                  // 102
              this.type('bin');                                                                               // 103
            }                                                                                                 // 104
          } else {                                                                                            // 105
            return this.json(chunk);                                                                          // 106
          }                                                                                                   // 107
          break;                                                                                              // 108
      }                                                                                                       // 109
                                                                                                              // 110
      // write strings in utf-8                                                                               // 111
      if (typeof chunk === 'string') {                                                                        // 112
        encoding = 'utf8';                                                                                    // 113
        type = this.get('Content-Type');                                                                      // 114
                                                                                                              // 115
        // reflect this in content-type                                                                       // 116
        if (typeof type === 'string') {                                                                       // 117
          this.set('Content-Type', 'utf-8');                                                                  // 118
        }                                                                                                     // 119
      }                                                                                                       // 120
                                                                                                              // 121
      // populate Content-Length                                                                              // 122
      if (chunk !== undefined) {                                                                              // 123
        if (!Buffer.isBuffer(chunk)) {                                                                        // 124
          // convert chunk to Buffer; saves later double conversions                                          // 125
          chunk = new Buffer(chunk, encoding);                                                                // 126
          encoding = undefined;                                                                               // 127
        }                                                                                                     // 128
                                                                                                              // 129
        len = chunk.length;                                                                                   // 130
        this.set('Content-Length', len);                                                                      // 131
      }                                                                                                       // 132
                                                                                                              // 133
      // method check                                                                                         // 134
      var isHead = req.method === 'HEAD';                                                                     // 135
                                                                                                              // 136
      // freshness                                                                                            // 137
      if (req.fresh) this.statusCode = 304;                                                                   // 138
                                                                                                              // 139
      // strip irrelevant headers                                                                             // 140
      if (204 == this.statusCode || 304 == this.statusCode) {                                                 // 141
        this.removeHeader('Content-Type');                                                                    // 142
        this.removeHeader('Content-Length');                                                                  // 143
        this.removeHeader('Transfer-Encoding');                                                               // 144
        chunk = '';                                                                                           // 145
      }                                                                                                       // 146
                                                                                                              // 147
      // skip body for HEAD                                                                                   // 148
      if (isHead) {                                                                                           // 149
        this.end();                                                                                           // 150
      }                                                                                                       // 151
                                                                                                              // 152
      // respond                                                                                              // 153
      this.end(chunk, encoding);                                                                              // 154
                                                                                                              // 155
      return this;                                                                                            // 156
    };                                                                                                        // 157
                                                                                                              // 158
      return prerenderio(req, res, next);                                                                     // 159
  });                                                                                                         // 160
});                                                                                                           // 161
                                                                                                              // 162
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['dfischer:prerenderio'] = {};

})();

//# sourceMappingURL=dfischer_prerenderio.js.map
