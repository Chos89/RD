	isNotEmpty = function(value) {
    if (value && value !== ''){
        return true;
    }
    console.log('Please fill in all required fields.');
    return false;
	};

	isEmail = function(value) {
	    var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	    if (filter.test(value)) {
	        return true;
	    }
	    console.log('Please enter a valid email address.');
	    return false;
	};

	isValidPassword = function(password) {
	    if (password.length < 6) {
	        console.log('Your password should be 6 characters or longer.');
	        return false;
	    }
	    return true;
	};

	areValidPasswords = function(password, confirm) {
	    if (!isValidPassword(password)) {
	        return false;
	    }
	    if (password !== confirm) {
	        console.log('Your two passwords are not equivalent.');
	        return false;
	    }
	    return true;
	};

	trimInput = function(value) {
    return value.replace(/^\s*|\s*$/g, '');
	};

	Template.ForgotPassword.events({


	  'submit #forgotPasswordForm': function(e, t) {
	    e.preventDefault();

	    var forgotPasswordForm = $(e.currentTarget),
	        email = trimInput(forgotPasswordForm.find('#forgotPasswordEmail').val().toLowerCase());

	    if (isNotEmpty(email) && isEmail(email)) {

	      Accounts.forgotPassword({email: email}, function(err) {
	        if (err) {
	          if (err.message === 'User not found [403]') {
	            swal('This email does not exist.');
	          } else {
	            swal('We are sorry but something went wrong.');
	          }
	        } else {
	          swal('Email Sent. Check your mailbox.');
	          Router.go('/');
	        }
	      });

	    }
	    return false;
	  },
	});

	if (Accounts._resetPasswordToken) {
	  Session.set('resetPassword', Accounts._resetPasswordToken);
	}

	Template.ResetPassword.helpers({
	 resetPassword: function(){
	  return Session.get('resetPassword');
	 }
	});

	Template.ResetPassword.events({
	  'submit #resetPasswordForm': function(e, t) {
	    e.preventDefault();

	    var resetPasswordForm = $(e.currentTarget),
	        password = resetPasswordForm.find('#resetPasswordPassword').val(),
	        passwordConfirm = resetPasswordForm.find('#resetPasswordPasswordConfirm').val();

	    if (isNotEmpty(password) && areValidPasswords(password, passwordConfirm)) {
	      Accounts.resetPassword(Session.get('resetPassword'), password, function(err) {
	        if (err) {
	          swal('We are sorry but something went wrong.');
	          Router.go('/');
	        } else {
	          swal('Your password has been changed. Welcome back!');
	          Session.set('resetPassword', null);
	          Router.go('/');
	        }
	      });
	    }
	    return false;
	  }
	});
