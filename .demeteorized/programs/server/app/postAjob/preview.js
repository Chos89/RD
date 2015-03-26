(function(){if (Meteor.isClient) {

	var date = new Date();

	Template.form.onCreated(function(){
		  Session.set('job', []);
	})
	


	Template.form.events({

		'keyup form, click form': function(event){

			
	    var job = Session.get('job');
	   
    	var company = event.currentTarget.company.value;
    	var companyUrl = event.currentTarget.companyUrl.value;
    	var tags = $("#tags").tagsinput('items');
    	var shortJobDesc = event.currentTarget.shortJobDesc.value;
    	var engagement = event.currentTarget.engagement.value;
    	var location = event.currentTarget.location.value;
    	var aboutCompany = UniHTML.purify($('.textarea').eq(0).code());
    	var requirement = UniHTML.purify($('.textarea').eq(1).code());
    	var bonus = UniHTML.purify($('.textarea').eq(2).code());
    	var perks = UniHTML.purify($('.textarea').eq(3).code());
    	var contact = UniHTML.purify($('.textarea').eq(4).code());
	    

	    

	    var data = {
	      "company": company,
	      "companyUrl": companyUrl,
	      "shortJobDesc": shortJobDesc,
	      "tags": tags,
	      "engagement": engagement,
	      "location": location,
	      "aboutCompany": aboutCompany,
	      "requirement": requirement,
	      "bonus": bonus,
	      "perks": perks,
	      "contact": contact,
	      "date": Date.now()
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

})();
