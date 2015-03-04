Router.configure({
   
    layoutTemplate: 'layout'
});

Router.route('/', function () {
  this.render('main');
});

Router.route('/postajob', function () {
  this.render('postajob');
});