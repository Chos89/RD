// Meteor.subscribe("jobs");

// var options = {
//   keepHistory: 1000 * 60,
//   localSearch: true
// };
// var fields = ['shortJobDesc', 'tags'];

// JobsSearch = new SearchSource('jobs', fields, options);



// // Template.jobs.helpers({
// //   jobs: function() {
// //    console.log(JobsSearch.getData({}))
   

// //     return JobsSearch.getData();
      
    
// //   }
// // });

// // //JobsSearch.fetchData = function(searchText, options, success) {
// //  //     Meteor.call('jobs', searchText, options, function(err, data) {
// //  //     success(err, data);
// //  //   });
// //  // };


// Template.jobs.rendered = function() {
//   JobsSearch.search('');
// };

// Template.jobs.events({
//   "keyup #search": _.throttle(function(e) {
//     var text = $(e.target).val().trim();
//     JobsSearch.search(text);
//   }, 200)
// });