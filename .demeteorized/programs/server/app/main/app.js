(function(){Jobs = new Mongo.Collection('jobs');
Jobs.allow({
	insert: function (userId, doc) {
		return (userId && doc.createdBy === userId);
	},
	update: function(userId, doc){
		return (userId && doc.createdBy === userId);	
	}
});

Meteor.users.allow({
	insert: function (userId, doc) {
		return true
	},
	update: function (userId, doc, fields, modifier) {
		return true
	}
});

Accounts.config({ 
	sendVerificationEmail: true
});


if (Meteor.isServer) {

	//Jobs._ensureIndex({tags: 1, shortJobDesc: 1});

	Meteor.publish("jobs", function () {
   
    	return Jobs.find();

  });
	
	Meteor.methods({
		sendVerificationEmail: function(){
				Accounts.sendVerificationEmail(this.userId);
		}
	})

	//prerenderio.set('prerenderToken', 'rt3duEtFkHFKBom7Kleq');

}


if (Meteor.isClient) {


	
	Meteor.subscribe("jobs");

	var dateOffset = (24*60*60*1000) * 30;
	var checkDate = new Date();
	var storeDate = Date.now();
	var startDate = checkDate.setTime(checkDate.getTime() - dateOffset);



	Template.navbar.onRendered(function() {
  		$(function(){
      $("#slideshow").teletype({
        text: [" sometimes the perfect match just isn't near you.", " you feel like working from a beach in Bali.", " you don't feel like relocating.", " technology connects. ^20000000 "],
        typeDelay: 0,
        prefix: "Because"
        
      });
 	 });
	})

	
	Template.form.onRendered(function(){
		
		$(document).ready(function() {
		  $('.textarea').summernote({
		  	height: 300,
		  	toolbar: [
		  		['style', ['bold', 'italic', 'underline', 'clear']],
		  		['fontsize', ['fontsize']],
		  		['para', ['ul', 'ol', 'paragraph']],
		  		['insert',['link']]
		  	]
		  });
		});
		$(function() {
    		$("input[data-role=tagsinput], select[multiple][data-role=tagsinput]").tagsinput();
	 	 });
	})
	

		Template.form.events({
		
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
	    // var bonus = UniHTML.purify($('.textarea').eq(2).code());
	    // var perks = UniHTML.purify($('.textarea').eq(2).code());
	    var contact = UniHTML.purify($('.textarea').eq(2).code());

	    if (company.length == 0 || companyUrl.length == 0 || shortJobDesc.length == 0 || aboutCompany.length == 0 || requirement.length == 0 || contact.length == 0) {

	    	swal('Please fill out all the fields...');
	    } else {
	   
	    Jobs.insert({
	      "createdBy": createdBy,
	      "company": company,
	      "companyUrl": companyUrl,
	      "tags": tags,
	      "shortJobDesc": shortJobDesc,
	      "engagement": engagement,
	      "location": location,
	      "aboutCompany": aboutCompany,
	      "requirement": requirement,
	      // "perks": perks,
	      // "bonus": bonus,
	      "contact": contact,
	      "active": 'show',
	      "date":  Date.now() // current time
	    });

	   	swal('Your job has been posted')

	    Router.go('/');
	   
	    // Prevent default form submit
	    return false;
	    }
	  }
	});







	Template.loginRegister.events({

	"click #showPassword": function(){
		$("#register-password").attr('type', 'text');
		$('#showPassword').addClass('invisible');	
		$('#hidePassword').removeClass('invisible');	
	},	
	"click #hidePassword": function(){
		$("#register-password").attr('type', 'password');
		$('#showPassword').removeClass('invisible');	
		$('#hidePassword').addClass('invisible');	
	},	

	"click #notRegistered": function () {
			$( "#register-form" ).removeClass( "invisible" );
			$( "#backToLogin" ).removeClass( "invisible" );
			$( "#login-form" ).addClass( "invisible" );
			$( "#notRegistered" ).addClass( "invisible" );
			$( "#forgotPassword" ).addClass( "invisible" );

		},
	"click #backToLogin": function () {
			$( "#login-form" ).removeClass( "invisible" );
			$( "#register-form" ).addClass( "invisible" );
			$( "#backToLogin" ).addClass( "invisible" );
			$( "#notRegistered" ).removeClass( "invisible" );
			$( "#forgotPassword" ).removeClass( "invisible" );

		},	

	'submit #login-form' : function(e, t){
	      e.preventDefault();
	      // retrieve the input field values
	      var email = t.find('#login-email').value
	        , password = t.find('#login-password').value;

	        // Trim and validate your fields here.... 

	        // If validation passes, supply the appropriate fields to the
	        // Meteor.loginWithPassword() function.
	        Meteor.loginWithPassword(email, password, function(err){
	        if (err){
	          // The user might not have been found, or their passwword
	          // could be incorrect. Inform the user that their
	          // login attempt has failed. 
	           swal("Wrong username or password");
	
	        } else {
	          // The user has been logged in.
	      		swal("You have logged in");
	      		$('#logInModal').modal('hide');
	      	}
	      	});
	         return false; 
	    }
 	});

	Template.loginRegister.events({

	'click #forgotPassword': function(){
	
		Router.go('forgot-password');
		$('#logInModal').modal('hide');

	},	



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

      Accounts.createUser({username: email, email: email, password : password}, function(err){


          if (err) {
            // Inform the user that account creation failed
            // swal('Could not register');

              if (err.message === 'Email already exists. [403]') {
	            swal('We are sorry but this email is already used.');
	          } else {
	            swal('We are sorry but something went wrong.');
	          }

          } else {
            // Success. Account has been created and the user
            // has logged in successfully. 
            

            swal("You have successfully registered!");
            swal("A validation email should arive shortly to your email address")
            $('#logInModal').modal('hide');
			
          }

        });

      	return false;
    } else {

    	swal("Password needs to be atlest 6 characters long")
    }}

	
  });


	Template.verifyEmail.onCreated(function() {
	
	  if (Accounts._verifyEmailToken) {
	    Accounts.verifyEmail(Accounts._verifyEmailToken, function(err) {
	      if (err) {
	         
	          swal(
	          	'Sorry this verification link has expired.',
	          	'You can resend the verification email from your profile page'
	         )
	         Router.go('/');
	         window.location.reload();
	      } else {
	        swal('Thank you! Your email address has been confirmed.')
	        Router.go('/');

	      }
	    });
	  }
	});


	UI.registerHelper("formatDate", function(date) {
     
        return moment(date).format('MMMM Do');

    });

    Template.registerHelper("verified", function(){

    		if (Meteor.user().emails[0].verified) {
    			return true;
    		} else {
    			return false;
    		}
    });

}

})();
