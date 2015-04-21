(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;

(function () {

//////////////////////////////////////////////////////////////////////////
//                                                                      //
// packages/okgrow:analytics/lib/browser-policy.js                      //
//                                                                      //
//////////////////////////////////////////////////////////////////////////
                                                                        //
if (Package["browser-policy-common"]) {                                 // 1
  console.log("This should not show");                                  // 2
  var content = Package['browser-policy-common'].BrowserPolicy.content; // 3
  if (content) {                                                        // 4
    content.allowOriginForAll("www.google-analytics.com");              // 5
    content.allowOriginForAll("cdn.mxpnl.com");                         // 6
  }                                                                     // 7
}                                                                       // 8
                                                                        // 9
//////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['okgrow:analytics'] = {};

})();

//# sourceMappingURL=okgrow_analytics.js.map
