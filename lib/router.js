Router.configure({
   
    layoutTemplate: 'layout',
    notFoundTemplate: '404'
});

Router.route('/', function () {
  this.render('main');
});

Router.route('/postajob', function () {
	if (!Meteor.user()) {

	swal('Log in to post jobs')
	this.render('main');
	Router.go('/');

    } else if ( !Meteor.user().emails[0].verified ) {

    	swal("Please verifiy your email to post jobs");
    	this.render('main');
		Router.go('/');

	} else {

	  this.render('postajob');
	}
});


Router.route('/verify-email', function () {
	
		this.render('verifyEmail');
	  
});

Router.route('/forgot-password', function () {
	
		this.render('ForgotPassword');
	  
});

Router.route('/reset-password', function () {
	
		this.render('ResetPassword');
	  
});

Router.route('/profile', function () {
	if (!Meteor.user()) {

		
		this.render('main');
		Router.go('/');

	} else {

		this.render('profile');
	}

	  
});
Router.route('/edit/:_id', function(){
	
	if (Meteor.user() && Jobs.findOne({_id: this.params._id}).createdBy == Meteor.user()._id) {
		
	this.render('edit', {
		data: function(){
				
				return Jobs.findOne({_id: this.params._id})
		}
	})
	} else {
		swal('You are not authorized to edit this document...')
	    Router.go('/')
	}	
})

Router.route('/job/:_id', function () {
  this.render('job', {
    data: function () {
      return Jobs.findOne({_id: this.params._id});

    }

   });
});
