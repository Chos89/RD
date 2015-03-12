if (Meteor.isClient) {

	Template.job.helpers({

		jobs: function(){
			return	Jobs.find({createdBy: this.createdBy}, {sort: {date: -1}})
		}
	})


 };

 // function(){

 // 	var a = moment(this.date);
	// var b = moment(new date);
	


 // 	if ( (a.diff(b, 'days')) < 30) {

 // 		return this.date

 // 	} else {
 		
 // 		return false

	// }
 // }

