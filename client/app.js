var options = {
  keepHistory: 1000 * 60 * 5,
  localSearch: true
};
var fields = ['tags', 'shortJobDesc'];

JobsSearch = new SearchSource('jobs', fields, options);

Template.jobs.helpers({
  jobs: function() {
    return JobsSearch.getData({
      // transform: function(matchText, regExp) {
      //   return matchText.replace(regExp, "<b>$&</b>")
      // },
      // sort: {date: -1}
    });
  },
  
  isLoading: function() {
    return JobsSearch.getStatus().loading;
  }
});

Template.jobs.rendered = function() {
  JobsSearch.search('');
};

Template.jobs.events({
  "keyup #search": _.throttle(function(e) {
    var text = $(e.target).val().trim();
    JobsSearch.search(text);
  }, 200)
});