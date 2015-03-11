if (Meteor.isClient) {

	Meteor.subscribe("jobs");

	Template.profile.helpers({
	  profileJobs: function () {
	    return Jobs.find({createdBy: Meteor.userId()}, {sort: {date: -1}});
		}
	  
	});

}	

