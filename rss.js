RssFeed.publish('jobs', function(query) {
  var self = this;
  // We got 3 helpers:
  // 1. self.setValue
  // 2. self.addItem
  // 3. self.cdata


  // query is the parsed querystring as an object
  // eg. foo=latest would be query.foo === 'latest'

  // feed handler helpers
  // this.cdata, this.setValue, this.addItem
  self.setValue('title', self.cdata('Remote Desk'));
  self.setValue('description', self.cdata('Remote Desk is THE place for finding remote jobs and remote workers'));
  self.setValue('link', 'https://remotedesk.work');
  self.setValue('lastBuildDate', new Date());
  self.setValue('pubDate', new Date());
  self.setValue('ttl', 1);
  // managingEditor, webMaster, language, docs, generator

  Jobs.find({}).forEach(function(doc) {
    self.addItem({
      title: doc.shortJobDesc,
      description: doc.requirement,
      link: 'https://remotedesk.work/job/' + doc._id,
      tags: doc.tags,
      pubDate: doc.date
      // title, description, link, guid, pubDate
    });
  });

});