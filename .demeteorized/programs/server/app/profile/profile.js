(function(){if (Meteor.isClient) {

	Meteor.subscribe("jobs");

	Template.profile.helpers({
	  profileJobs: function () {
	    return Jobs.find({createdBy: Meteor.userId()}, {sort: {date: -1}});
		}
	  
	});


	Template.profile.events({

		"click #sendVerificationEmail": function(){
				Meteor.call('sendVerificationEmail');
				window.location.reload();
				swal("A new verification email has been sent");
		}
	})
}	


})();
