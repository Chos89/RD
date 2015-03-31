if (Meteor.isClient) {

	Meteor.subscribe("jobs");

	Template.profile.helpers({
	  profileJobs: function () {
	    return Jobs.find({createdBy: Meteor.userId()}, {sort: {date: -1}});
		},

		active: function(){
			if (this.active === 'show') {

				return true
			} else if (this.active === 'hide'){

				return false
				
			}
		}
	});


	Template.profile.events({

		"click #sendVerificationEmail": function(){
				Meteor.call('sendVerificationEmail');
				window.location.reload();
				swal("A new verification email has been sent");
		},

		"click #deactivate": function(){
				
				Jobs.update({_id: this._id}, {$set: {'active': 'hide'}})
		},

		"click #activate": function(){
				
				Jobs.update({_id: this._id}, {$set: {'active': 'show'}})
		}


	})
}	

