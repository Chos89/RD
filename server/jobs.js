

// var dateOffset = (24*60*60*1000) * 30;
// var checkDate = new Date();
// var storeDate = Date.now();
// var startDate = checkDate.setTime(checkDate.getTime() - dateOffset);

// function searchData(){
    


// SearchSource.defineSource('jobs', function(searchText, options) {
//   var options = {sort: {date: -1}, limit: 200};
//   console.log('fetch ' + Jobs.find().fetch())
//   if(searchText) {
//     var regExp = buildRegExp(searchText);
//     var selector = {
//       date:{$gte: startDate, $lt:storeDate},
//       $or: [
//       {shortJobDesc: regExp},
//       {tags: regExp}
//     ]};
//     return Jobs.find(selector, options).fetch();
//   } else {
//     return Jobs.find({date:{$gte: startDate, $lt:storeDate}}, options).fetch();
//   }


// });

// }

// searchData()



// function buildRegExp(searchText) {
//   // this is a dumb implementation
//   var parts = searchText.trim().split(/[ \-\:]+/);
//   return new RegExp("(" + parts.join('|') + ")", "ig");
// }