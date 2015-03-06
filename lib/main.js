var Jobs = new Mongo.Collection('jobs');



if (Meteor.isServer) {

	Meteor.publish("jobs", function () {
   
    	return Jobs.find();
    
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
	

		Template.form.events({
		
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

Template.login.events({

    'submit #login-form' : function(e, t){
      e.preventDefault();
      // retrieve the input field values
      var email = t.find('#login-email').value
        , password = t.find('#login-password').value;

        // Trim and validate your fields here.... 

        // If validation passes, supply the appropriate fields to the
        // Meteor.loginWithPassword() function.
        Meteor.loginWithPassword(email, password, function(err){
        if (err)
          // The user might not have been found, or their passwword
          // could be incorrect. Inform the user that their
          // login attempt has failed. 
        	alert("Wrong username or password")
        else
          // The user has been logged in.
      		alert("You have logged in")
      });
         return false; 
      }
  });

	Template.register.events({
    'submit #register-form' : function(e, t) {
      e.preventDefault();
      var email = t.find('#register-email').value
        , password = t.find('#register-password').value;

        // Trim and validate the input
        var trimInput = function(val) {
		    return val.replace(/^\s*|\s*$/g, "");
		  }

		var email = trimInput(email);

		var isValidPassword = function(val) {
		     return (val.length >= 6) ? true : false; 
		  }

		if (isValidPassword(password)) { 

      Accounts.createUser({email: email, password : password}, function(err){
          if (err) {
            // Inform the user that account creation failed
            alert('Could not register')
          } else {
            // Success. Account has been created and the user
            // has logged in successfully. 
            alert("You have successfully registered!")
          }

        });

      return false;
    } else {alert("password needs to be atlest 6 characters long")}
	}
  });

	UI.registerHelper("formatDate", function(date) {
     
        return moment(date).format('Do MMM');

    });

   
}