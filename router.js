Router.configure({
   
    layoutTemplate: 'layout'
});

Router.route('/', function () {
  this.render('main');
});

Router.route('/postajob', function () {
	if (!Meteor.user()) {

	swal('Log in to post jobs')
	this.render('main');
	Router.go('/');

} else {

  this.render('postajob');
}
});

Router.route('/profile', function () {
if (!Meteor.user()) {

	
	this.render('main');
	Router.go('/');

} else {

	this.render('profile');
}

  
});

Router.route('/job/:_id', function () {
  this.render('job', {
    data: function () {
      return Jobs.findOne({_id: this.params._id});

    }

   });
});
