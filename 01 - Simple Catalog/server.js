/**
 * server.js
 * This file defines the server for a
 * simple photo gallery web app.
 */
"use strict;"

/* global variables */
var multipart = require('./multipart');
var template = require('./template')
var http = require('http');
var url = require('url');
//var bodyParser = require('body-parser');
var fs = require('fs');
var port = 3090;
var script = fs.readFileSync('gallery.js');

/* load cached files */
var config = JSON.parse(fs.readFileSync('config.json'));
var stylesheet = fs.readFileSync('gallery.css');

/*
* This method gets the name of the query
*
*
*/

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
/*
* This function get a single profile
*/
function getUserProfile(callback){
    fs.readdir('people/', function(err, jsonFileNames){
    if(err) callback(err, undefined);
    else callback(false, jsonFileNames);
  });

}

function imageProfileToTags(jsonFileNames){
//  console.log(jsonFileNames);
  return jsonFileNames.map(function(jsonFileNames) {
    var profile = JSON.parse(fs.readFileSync("people/"+jsonFileNames));
    console.log(profile);
    return `<div class="card gallery text-center"><a method="GET" href="people?name=${profile.Name}"><img class="card-img-top" class="rounded float-left" src="${profile.Picture}" alt="${profile.Picture}"></a><div class="card-block"><h4 class="card-title">${profile.Name}</h4></div></div>`;
  });
}
/*
* Done
*/
function getProfiles(callback) {
  fs.readdir('people/', function(err, fileNames){
    if(err) callback(err, undefined);
    else callback(false, fileNames);
  });
}

function buildGalleryProfiles(jsonFile)
{
  var s = `<img class="img-thumbnail" src="${jsonFile.Picture}" alt="${jsonFile.Picture}">`;
  return template.render('gallery',{
    title: config.Title,
    imageTags: imageProfileToTags(jsonFile).join('')
  });
}

function buildProfile(jsonFile)
{
  var s = `<img class="img-thumbnail profile" src="${jsonFile.Picture}" alt="${jsonFile.Picture} class="img-thumbnail">`;
  return template.render('profile',{
    title: jsonFile.Name,
    imageTags: s,
    desc: jsonFile.Description
  });
}


function serveProfileGallery(req, res) {
  getUserProfile(function(err, imageNames){
    if(err) {
      console.error(err);
      res.statusCode = 500;
      res.statusMessage = 'Server error';
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(buildGalleryProfiles(imageNames));
  });
}

function serveProfile(jsonFileName, req, res)
{
    var name = getParameterByName("name", jsonFileName);
    var nSplit = name.split(' ');
    var realName = nSplit[0]+'_'+nSplit[1];

    fs.readFile('people/'+  realName +'.json', function(err, data){
      if(err) {
        console.error(err);
        res.statusCode = 404;
        res.statusMessage = "Resource not found";
        res.end();
        return;
      }
    });

    var profile = JSON.parse(fs.readFileSync("people/"+realName+".json"));
    res.end(buildProfile(profile));

}

function serveImage(fileName, req, res) {
  fs.readFile('images/' + decodeURIComponent(fileName), function(err, data){
    if(err) {
      console.error(err);
      res.statusCode = 404;
      res.statusMessage = "Resource not found";
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'image/*');
    res.end(data);
  });
}


function uploadImage(req, res) {
  multipart(req, res, function(req, res) {
    // make sure an image was uploaded
    //var urlParts = bodyParser.json(req.body);
    var FName = req.body.FName;
    var LName = req.body.LName;
  //  var ls = urlParts.query.FName
    //console.log("URL :"+ls);
    console.log("Firstname: "+FName);
    console.log("Lastname: "+LName);

    if(!req.body.image.filename) {
      console.error("No file in upload");
      res.statusCode = 400;
      res.statusMessage = "No file specified"
      res.end("No file specified");
      return;
    }else if(!req.body.FName) {
      console.error("No firstname");
      res.statusCode = 400;
      res.statusMessage = "No FirstName"
      res.end("No lastname specified");
      return;
    }else if(!req.body.LName){
      console.error("No lastname");
      res.statusCode = 400;
      res.statusMessage = "No LastName"
      res.end("No lastname specified");
      return;
    }else if(!req.body.Description){
      console.error("No description");
      res.statusCode = 400;
      res.statusMessage = "No description"
      res.end("No description specified");
      return;


    }

    var FullName = FName+"_"+LName;

    console.log("FullName: "+FullName);







    fs.writeFile('images/' + FullName+".jpg", req.body.image.data, function(err){
      if(err) {
        console.error(err);
        res.statusCode = 500;
        res.statusMessage = "Server Error";
        res.end("Server Error");
        return;
      }

      writeJSONFile(req, res, FullName, req.body.Description);
    });



  });
}


function writeJSONFile(req, res, FullName, description)
{
  var sPlit = FullName.split('_');
  var name = sPlit[0]+" "+sPlit[1];

  var data = {
    "Name": name,
    "Picture": FullName+".jpg",
    "Description": description

  }

  var jsonData = JSON.stringify(data);

  fs.writeFile('people/'+FullName+'.JSON', jsonData, function(err) {
    if(err) {
        return console.log(err);
    }

    serveProfileGallery(req, res);

  });



}




function handleRequest(req, res) {
  // at most, the url should have two parts -
  // a resource and a querystring separated by a ?
  var urlParts = url.parse(req.url);

  if(urlParts.query){
      var matches = /title=(.+)($|&)/.exec(urlParts.query);
      if(matches && matches[1]){
        config.Title = decodeURIComponent(matches[1]);
        fs.writeFile('config.json', JSON.stringify(config));
        //console.log("Works :"+matches[2]);
      }
    }

  console.log("url path name: "+urlParts.pathname);
  switch(urlParts.pathname) {
    case '/':
    case '/gallery':
      if(req.method == 'GET') {
        serveProfileGallery(req, res);
        console.log("OK");
      } else if(req.method == 'POST') {
        uploadImage(req, res);
      }
      break;
    case '/gallery.css':
      res.setHeader('Content-Type', 'text/css');
      res.end(stylesheet);
      break;
    case '/gallery.js':
      res.setHeader('Content-Type', 'text/javascript');
      res.end(script);
      break;
    case '/people':

        console.log("Url name: "+urlParts.query.name);
        serveProfile(req.url, req, res);
        //serveProfile(req.url, req, res);
        //console.log("Name: "+nSplit[0]+"_"+nSplit[1]);

    break;
    default:
    //serveProfileGallery(req.url, req, res);
      serveImage(req.url, req, res);

  }
}

/* Create and launch the webserver */
var server = http.createServer(handleRequest);
server.listen(port, function(){
  console.log("Server is listening on port ", port);
});
