
if (Meteor.isClient) {

	Meteor.subscribe('jobs');	

	Template.edit.onCreated(function () {


		
		Session.set('edit', Template.currentData());
		editData = Session.get('edit');
		
	});


	Template.edit.onRendered(function () {
		
      $(document).ready(function() {
		  $('.textarea').summernote({
		  	height: 300,
		  	toolbar: [
		  		['style', ['bold', 'italic', 'underline']],
		  		['para', ['ul', 'ol', 'paragraph']],
		  		['insert',['link']]
		  	]
		  });
		});
		$(function() {
    		$("input[data-role=tagsinput], select[multiple][data-role=tagsinput]").tagsinput();
	 	 });


		$('#company').val(editData.company);
		$('#companyUrl').val(editData.companyUrl);
		$('#shortJobDesc').val(editData.shortJobDesc);
		$('#tags').tagsinput('removeAll');
		for (var i = 0 ; i < editData.tags.length ; i++) {
			
			$("#tags").tagsinput('add', editData.tags[i]);
		};
		
		$('#location').val(editData.location);
		$('.textarea').eq(0).code(editData.aboutCompany);
		$('.textarea').eq(1).code(editData.requirement);
		$('.textarea').eq(2).code(editData.bonus);
		$('.textarea').eq(3).code(editData.perks);
		$('.textarea').eq(4).code(editData.contact);
	});
		

	Template.edit.events({

		'keyup form, click form': function(event){

			
	    var edit = Session.get('edit');
	   
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
	      "tags": tags,
	      "shortJobDesc": shortJobDesc,
	      "engagement": engagement,
	      "location": location,
	      "aboutCompany": aboutCompany,
	      "requirement": requirement,
	      "bonus": bonus,
	      "perks": perks,
	      "contact": contact,
	      "date": Date.now()
	    }
	    

	    Session.set('edit', data);
	    
		},

		"submit form": function (event) {
	    // This function is called when the new task form is submitted
	    event.preventDefault()	
	    var createdBy = Meteor.user()._id;
	    var company = event.target.company.value;
	    var companyUrl = event.target.companyUrl.value;
	    var tags = $("#tags").tagsinput('items');
	    var shortJobDesc = UniHTML.purify(event.target.shortJobDesc.value);
	    var engagement = event.target.engagement.value;
	    var location = event.target.location.value;
	    var aboutCompany = UniHTML.purify($('.textarea').eq(0).code());
	    var requirement = UniHTML.purify($('.textarea').eq(1).code());
	    var bonus = UniHTML.purify($('.textarea').eq(2).code());
	    var perks = UniHTML.purify($('.textarea').eq(3).code());
	    var contact = UniHTML.purify($('.textarea').eq(4).code());

	    if (company.length == 0 || companyUrl.length == 0 || shortJobDesc.length == 0 || aboutCompany.length == 0 || requirement.length == 0 || bonus.length == 0 || perks.length == 0 || contact.length == 0) {

	    	swal('Please fill out all the fields...');
	    } else if (this.createdBy == Meteor.user()._id){
	   
	    Jobs.update({_id: this._id}, {$set: {
	      
	      "company": company,
	      "companyUrl": companyUrl,
	      "tags": tags,
	      "shortJobDesc": shortJobDesc,
	      "engagement": engagement,
	      "location": location,
	      "aboutCompany": aboutCompany,
	      "requirement": requirement,
	      "perks": perks,
	      "bonus": bonus,
	      "contact": contact,
	      
	    }});

	   	swal('Your job has been edited')
	   	Session.set('edit', {});
	    Router.go('/');
	   
	    // Prevent default form submit
	    return false;
	    }
	  }
	});
	

	Template.editPreview.helpers({
  		editPreview: function(){
    
    	return	Session.get("edit");
  		} 
	});


}