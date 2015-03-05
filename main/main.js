var Jobs = new Mongo.Collection('jobs');


if (Meteor.isServer) {

	Meteor.publish("jobs", function () {
    return Jobs.find();
    console.log(Jobs.find())
  });
  
}



if (Meteor.isClient) {
	
	Meteor.subscribe("jobs");

	Template.navbar.rendered = function() {
  		$(function(){
      $("#slideshow").teletype({
        text: [" sometimes the perfect match just isn't near you.", " you feel like working from a beach in Bali.", " you don't feel like relocating.", " technology connects. ^20000000 "],
        typeDelay: 0,
        prefix: "Because"
        
      });
 	 });
	}


	Template.jobs.helpers({
	  jobs: function () {
	    return Jobs.find({}, {sort: {date: -1}});
	  }
	});

	Template.form.rendered = function(){
		
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
	}
	
	Template.form.created = function(){
		  Session.set('job', []);
		}
	


	Template.form.events({

		'keyup form, click form': function(event){

			
	    var job = Session.get('job');
	   
    	var company = event.currentTarget.company.value;
    	var companyUrl = event.currentTarget.companyUrl.value;
    	var shortJobDesc = event.currentTarget.shortJobDesc.value;
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
	      "location": location,
	      "aboutCompany": aboutCompany,
	      "requirement": requirement,
	      "bonus": bonus,
	      "perks": perks,
	      "contact": contact,
	      "date": new Date() 
	    }
	    

	    Session.set('job', data);
	    
		},
		
		
	  	"submit form": function (event) {
	    // This function is called when the new task form is submitted
	    event.preventDefault()	

	    var company = event.target.company.value;
	    var companyUrl = event.target.companyUrl.value;
	    var tags = $("#tags").tagsinput('items');
	    var shortJobDesc = event.target.shortJobDesc.value;
	    var location = event.target.location.value;
	    var aboutCompany = $('.textarea').eq(0).code();
	    var requirement = $('.textarea').eq(1).code();
	    var bonus = $('.textarea').eq(2).code();
	    var perks = $('.textarea').eq(3).code();
	    var contact = $('.textarea').eq(4).code();

	    Jobs.insert({
	      "company": company,
	      "companyUrl": companyUrl,
	      "tags": tags,
	      "shortJobDesc": shortJobDesc,
	      "aboutCompany": aboutCompany,
	      "requirement": requirement,
	      "bonus": bonus,
	      "perks": perks,
	      "contact": contact,
	      "date": new Date() // current time
	    });

	    console.log(tags)
	    // Prevent default form submit
	    return false;
	  }
});

Template.preview.helpers({
  job: function(){
    
    return Session.get("job");

  } 
});

	UI.registerHelper("formatDate", function(date) {
     
        return moment(date).format('Do MMM');

    });

   
}