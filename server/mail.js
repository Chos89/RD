

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
  Accounts.emailTemplates.verifyEmail.text = function(user, url) {
    var url = url.replace('#/', 'verify-email/#/')
    return " To activate your account, simply click the link below:\n\n" + url;
  };

  Accounts.emailTemplates.resetPassword.text = function(user, url) {
    var url = url.replace('#/', 'reset-password/#/')
    return " To reset your password follow this link:\n\n" + url;
  };

Accounts.onCreateUser(function(options, user) {
  
  // we wait for Meteor to create the user before sending an email
  Meteor.setTimeout(function() {
    Accounts.sendVerificationEmail(this.userId);
    console.log(this.userId)
  }, 2 * 1000);

  return user;
});

