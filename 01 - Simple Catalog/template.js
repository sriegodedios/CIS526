fs = require('fs');

module.exports ={
  render: render
}

var fs = require('fs');

function render (templateName, context){
  var html = fs.readFileSync('templates/'+templateName + '.html');
  html = html.toString().replace(/<%=(.+)%>/g, function(match, js){
  return eval("var context = "+ JSON.stringify(context) +";"+js);
});
  return html;
}
