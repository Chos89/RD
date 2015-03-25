(function(){if (Meteor.isClient) {

	Template.job.helpers({

		jobs: function(){
			return	Jobs.find({createdBy: this.createdBy}, {sort: {date: -1}})
		}
	})


 };


})();
