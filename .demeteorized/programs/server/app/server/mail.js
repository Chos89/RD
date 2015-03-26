(function(){

  smtp = {
    username: 'j.ivkovic@remotedesk.work',   // eg: server@gentlenode.com
    password: '22iy-qxcBNrpkv6v0eAlrQ',   // eg: 3eeP1gtizk5eziohfervU
    server:   'smtp.mandrillapp.com',  // eg: mail.gandi.net
    port: 587
  }

  process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;



  // By default, the email is sent from no-reply@meteor.com. If you wish to receive email from users asking for help with their account, be sure to set this to an email address that you can receive email at.
  Accounts.emailTemplates.from = 'RemoteDesk <no-reply@remotedesk.work>';

  // The public name of your application. Defaults to the DNS name of the application (eg: awesome.meteor.com).
  Accounts.emailTemplates.siteName = 'Remote Desk';

  // A Function that takes a user object and returns a String for the subject line of the email.
  Accounts.emailTemplates.verifyEmail.subject = function(user) {
    return 'Confirm Your Email Address';
  };

  Accounts.emailTemplates.resetPassword.subject = function(user) {
    return 'Reset you password';
  };

  // A Function that takes a user object and a url, and returns the body text for the email.
  // Note: if you need to return HTML instead, use Accounts.emailTemplates.verifyEmail.html
  Accounts.emailTemplates.verifyEmail.html = function(user, url) {
    var url = url.replace('#/', 'verify-email/#/')
    return "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">" +
"<html xmlns=\"http://www.w3.org/1999/xhtml\">" +
"<head>" +
  "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />" +
  "<meta name=\"viewport\" content=\"width=device-width\"/>" +
"</head><body>" + 

    "<h1> Remote <span style=\"color: tomato;\"> Desk </span> </h1>" +
    "<h2> Thanks for using Remote Desk!"  +
    "<h3>To activate your account, simply click on the link below:</h3>" + 
    "<a href=" + url + ">Confirm you email</a> " + 

    "</body>" +
    "</html>";
  };

  Accounts.emailTemplates.resetPassword.html = function(user, url) {
    var url = url.replace('#/', 'reset-password/#/')
    return "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">" +
"<html xmlns=\"http://www.w3.org/1999/xhtml\">" +
"<head>" +
  "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />" +
  "<meta name=\"viewport\" content=\"width=device-width\"/>" +
"</head><body>" + 

    "<h1> Remote <span style=\"color: tomato;\"> Desk </span> </h1>" +
    "<h3>To reset your password click on the link below:</h3>" + 
    "<a href=" + url + ">Reset password</a> " + 

    "</body>" +
    "</html>";
  };

Accounts.onCreateUser(function(options, user) {
  
  // we wait for Meteor to create the user before sending an email
  Meteor.setTimeout(function() {
    Accounts.sendVerificationEmail(this.userId);
    console.log(this.userId)
  }, 3 * 1000);

  return user;
});


})();
