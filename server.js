#!/bin/env node
var config = require('config');
var connect = require('connect');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
var http = require('http');
var https = require('https');
var fs = require('fs');
console.log(config);

if (! config.isDev) {
http.createServer(function (req, res) {
  if (req.url.indexOf("/.well-known/acme-challenge") == 0 &&
      fs.statSync(__dirname + "/letsencrypt" + req.url).isFile() ) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(fs.readFileSync(__dirname + "/letsencrypt" + req.url));
  } else {
    res.writeHead(301, {'Location': 'https://'+ config.app.host + req.url});
  }
  res.end();
}).listen(80, config.app.ip);
}

var options = {
  key:    fs.readFileSync(config.ssl.key),
  cert:   fs.readFileSync(config.ssl.cert)
};
if(config.ssl.ca){options.ca = fs.readFileSync(config.ssl.ca);}

var server = https.createServer(options, function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html',"Access-Control-Allow-Origin": '*'});
  res.end( fs.readFileSync(__dirname + ( (req.url === "/") ? '/index.html' : '/vchat.html')));
}).listen(config.app.port, config.app.ip);

// var resource = connect().use(connect.static(__dirname + '/pub'));
// https.createServer(options,resource).listen(config.resource.port, config.resource.ip);

function setHeaders(res, path) {
  res.setHeader('Access-Control-Allow-Origin', '*')
}
var serve = serveStatic(__dirname + '/pub', {'setHeaders': setHeaders});
https.createServer(options, function onRequest (req, res) {
  serve(req, res, finalhandler(req, res))
}).listen(config.resource.port, config.resource.ip);
 
var signalmasterSockets = require('./signalmaster/sockets');
signalmasterSockets(server, config.signalmaster );


