Meteor.subscribe("jobs");

var options = {
  
  localSearch: true
};
var fields = ['shortJobDesc', 'tags'];

JobsSearch = new SearchSource('jobs', fields, options);



Template.jobs.helpers({
  jobs: function() {
   

    return JobsSearch.getData({sort: {date: -1}});
      
    
  },

  active: function(){
			if (this.active === 'show') {

				return true
			} else if (this.active === 'hide'){

				return false
				
			}
		}
});



Template.jobs.onRendered(function() {
  JobsSearch.search('');
});

Template.jobs.events({
  "keyup #search": _.throttle(function(e) {
    var text = $(e.target).val().trim();
    JobsSearch.search(text);
  
  }, 200)
});