'use strict';

var consts = require('../../constants');

function configure (app, wares, ctx) {
  var express = require('express'),
    api = express.Router( );

  // invoke common middleware
  api.use(wares.sendJSONStatus);
  // text body types get handled as raw buffer stream
  api.use(wares.bodyParser.raw( ));
  // json body types get handled as parsed json
  api.use(wares.bodyParser.json( ));
  // also support url-encoded content-type
  api.use(wares.bodyParser.urlencoded({ extended: true }));

  api.use(ctx.authorization.isPermitted('api:devicestatus:read'));

  // List settings available
  api.get('/devicestatus/', function(req, res) {
    var q = req.query;
    if (!q.count) {
      q.count = 10;
    }
    ctx.devicestatus.list(q, function (err, results) {
      return res.json(results);
    });
  });

  function config_authed (app, api, wares, ctx) {

    function doPost (req, res) {
      var obj = req.body;
      ctx.devicestatus.create(obj, function (err, created) {
        if (err) {
          res.sendJSONStatus(res, consts.HTTP_INTERNAL_ERROR, 'Mongo Error', err);
        } else {
          res.json(created);
        }
      });
    }

    api.post('/devicestatus/', ctx.authorization.isPermitted('api:devicestatus:create'), doPost);

    api.delete('/devicestatus/:_id', ctx.authorization.isPermitted('api:devicestatus:delete'), function(req, res) {
      console.log('Deleting id: ' + req.params._id);

      ctx.devicestatus.remove_id(req.params._id, function (err, removed) {
        if (err) {
          res.sendJSONStatus(res, consts.HTTP_INTERNAL_ERROR, 'Mongo Error', err);
        } else {
          res.json(removed);
        }
      });
    });

    // delete record that match query
    api.delete('/devicestatus/', ctx.authorization.isPermitted('api:devicestatus:delete'), function(req, res) {
      var query = req.query;

      console.log('Delete records with query: ', query);

      // remove using the query
      ctx.devicestatus.remove(query, function(err, stat) {
        if (err) {
          res.sendJSONStatus(res, consts.HTTP_INTERNAL_ERROR, 'Mongo Error', err);
          console.log('Error saving treatment');
          console.log(err);
        } else {
          res.json(stat);
          console.log('devicestatus records deleted');
        }
      });
    });

  }

  if (app.enabled('api') || true /*TODO: auth disabled for quick UI testing...*/) {
    config_authed(app, api, wares, ctx);
  }

  return api;
}

module.exports = configure;

