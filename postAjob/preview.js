if (Meteor.isClient) {

	Template.form.created = function(){
		  Session.set('job', []);
		}
	


	Template.form.events({

		'keyup form, click form': function(event){

			
	    var job = Session.get('job');
	   
    	var company = event.currentTarget.company.value;
    	var companyUrl = event.currentTarget.companyUrl.value;
    	var shortJobDesc = event.currentTarget.shortJobDesc.value;
    	var engagement = event.currentTarget.engagement.value;
    	var location = event.currentTarget.location.value;
    	var aboutCompany = $('.textarea').eq(0).code();
    	var requirement = $('.textarea').eq(1).code();
    	var bonus = $('.textarea').eq(2).code();
    	var perks = $('.textarea').eq(3).code();
    	var contact = $('.textarea').eq(4).code();
	    

	    

	    var data = {
	      "company": company,
	      "companyUrl": companyUrl,
	      "shortJobDesc": shortJobDesc,
	      "engagement": engagement,
	      "location": location,
	      "aboutCompany": aboutCompany,
	      "requirement": requirement,
	      "bonus": bonus,
	      "perks": perks,
	      "contact": contact,
	      "date": new Date() 
	    }
	    

	    Session.set('job', data);
	    
		}
	})


	Template.preview.helpers({
  		job: function(){
    
    	return Session.get("job");

  		} 
	});





}