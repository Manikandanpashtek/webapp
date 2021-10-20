/*
 * Express App
 */

import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as path from "path";
import * as favicon from "serve-favicon";
import * as session from "express-session";
// import SfmcApiDemoRoutes from './SfmcApiDemoRoutes';
import SfmcAppDemoRoutes from './SfmcAppDemoRoutes';
import Utils from './Utils';

const PORT = process.env.PORT || 5000

// Create & configure Express server
const app = express();

// Express configuration
app.set("port", PORT);
app.set("views", path.join(__dirname, "../views"));
app.set('view engine', 'ejs');

var pgp = require('./pgpromise.js');  
var db= require('./database.js') 

// Use helmet. More info: https://expressjs.com/en/advanced/best-practice-security.html
var helmet = require('helmet')
app.use(helmet());
// Allow X-Frame from Marketing Cloud. Sets "X-Frame-Options: ALLOW-FROM http://exacttarget.com".
app.use(helmet.frameguard({
    action: 'allow-from',
    domain: 'https://mc.s11.exacttarget.com/cloud/#app/Orkestra%20For%20MC'
  }))

app.use(session({
    name: 'server-session-cookie-id',
    secret: 'sanagama-df18',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setup static paths
app.use(express.static(path.join(__dirname, "../static")));
// app.use(favicon(path.join(__dirname,'../static','images','favicons', 'favicon.ico')));

// Routes: pages
// app.get('/', function(req, res) { Utils.initSampleDataAndRenderView(req, res, 'apidemo.ejs') });
app.get("/", function (req, res) {
  if (req.query.code === undefined) {
    const redirectUri = `https://${process.env.BASE_URL}.auth.marketingcloudapis.com/v2/authorize?response_type=code&client_id=${process.env.CLIENTID}&redirect_uri=${process.env.REDIRECT_URL}`;

    res.redirect(redirectUri);
  } else {
    res.render("apidemo.ejs", {
      authorization_code: req.query.code,
      tssd: req.query.tssd ? req.query.tssd : process.env.BASE_URL,
    });
    console.log("authorization_code=",req.query.code,"tssd=",process.env.BASE_URL);
    
  }
});

app.post("/api/getCustomerJourneyByKey", function (req, res) {
  //res.render("index.ejs"); // load the index.ejs file
  //var a=req.body;
  const { journey_key } = req.body;
  //const {Journeykey}='ixn-created-Meeting-Executed-api';
  console.log("req.body:" + req.body);
  console.log("journey_key:" + journey_key);
  const results = [];
  var query =
    "SELECT * from customer_journey \
INNER JOIN journey \
ON customer_journey.journey_id = journey.id \
INNER JOIN customer_journey_ds_values \
ON customer_journey_ds_values.journeyid = customer_journey.journey_id \
where journey.journey_key = '" +
    journey_key +
    "'";
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send(result.rows);
  });
});

app.post("/api/getJourneyDataExtensionByKey", function (req, res) {
  //res.render("index.ejs"); // load the index.ejs file
  //var a=req.body;
  
  const journey_key  = req.body.journeykey
  console.log("journeykey wo quotes",journey_key)
  //const {Journeykey}='ixn-created-Meeting-Executed-api';
  console.log("req.body:" + JSON.stringify(req.body));
  console.log("journey_key:" + req.body.journeykey);//for check
  const results = [];
  var query = "SELECT * FROM journey_data_extension \
    INNER JOIN dataextension \
    ON dataextension.ID = journey_data_extension.dataextensionid \
    INNER JOIN journey  \
        ON journey_data_extension.journeyid = journey.ID \
    where journey.journey_key ='"+
    journey_key
    +"'"
  
   db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    console.log('result.rows:'+JSON.stringify(result));
    console.log('result.rows:'+JSON.stringify(result.rows));
    res.status(200).send(result);
  });

});

app.post("/api/GetTemplateCustomerCreativeByKey", function (req, res) {
  //res.render("index.ejs"); // load the index.ejs file
  //var a=req.body;
  const { creative_key } = req.body;
  //const {Journeykey}='ixn-created-Meeting-Executed-api';
  console.log("req.body:" + req.body);
  console.log("creative_key:" + creative_key);
  var query =
    "SELECT * \
FROM customer_creative CC \
INNER JOIN creative CT \
  ON CT.ID = CC.creativeid \
INNER JOIN commoncreative B  \
ON CT.commoncreativeid = B.ID \
INNER JOIN base_template c \
ON B.base_templateid = c.ID \
WHERE CT.templatekey  = '" +
    creative_key +
    "'";

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send(result);
  });
});

app.post("/api/updatecustomerjourneystatus", function (req, res) {
  //res.render("index.ejs"); // load the index.ejs file
  const { journey_key, customer_key } = req.body;
  // var customer_key  = 'welath001';
  //var journey_key ='ixn-created-Meeting-Executed-api';
  var customer_id;
  var journey_id;
  var customer_journey_id;
  console.log("customer_key:" + customer_key);
  console.log("journey_key:" + journey_key);

  var customerquery =
    "SELECT id,name,salesforceid,customer_key FROM customer where customer_key = '" +
    customer_key +
    "'";
  db.query(customerquery, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    customer_id = result.rows[0].id;
    console.log("customerid:" + customer_id);
    var journeyquery =
      "SELECT * FROM journey where journey_key = '" + journey_key + "'";
    db.query(journeyquery, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      }
      journey_id = result.rows[0].id;
      console.log("journey_id:" + journey_id);
      var customerjourneyquery =
        "SELECT * FROM customer_journey where journey_id = '" +
        journey_id +
        "'  And customer_id = '" +
        customer_id +
        "' ";
      db.query(customerjourneyquery, (err, result) => {
        if (err) {
          console.log(err);
          res.status(400).send(err);
        }
        console.log("result:" + result);
        if (result.rows.length > 0) {
          console.log("dataid:" + result.rows[0].id);
          console.log("dataid:" + result.rows[0].mcstatus);
          if (result.rows[0].mcstatus != true) {
            console.log("inside mcstatus condition");
            var updateQuery =
              "UPDATE customer_journey SET mcstatus = true WHERE id = '" +
              result.rows[0].id +
              "'";
            db.query(updateQuery, (err, result) => {
              if (err) {
                console.log(err);
                res.status(400).send(err);
              }
              res.status(200).send(result.rows);
            });
          } else {
            res.status(400).send("already Exists");
          }
        } else {
          console.log("else condition");
          var insertQuery =
            "INSERT INTO customer_journey (customer_id, journey_id,mcstatus) VALUES ('" +
            customer_id +
            "','" +
            journey_id +
            "',true)";
          db.query(insertQuery, (err, result) => {
            if (err) {
              console.log(err);
              res.status(400).send(err);
            }
            res.status(200).send(result.rows);
          });
        }
      });
    });
  });

  /*       db.query(customerquery, true)
    .then(function (data) {
    customer_id=data[0].id;
    console.log('customerid:'+customer_id);
    var journeyquery = "SELECT * FROM journey where journey_key = '" + journey_key + "'";
    db.query(journeyquery, true)
    .then(function (data) {
    journey_id=data[0].id;
    console.log('journey_id:'+journey_id);
     // return res.json(data);
    var customerjourneyquery= "SELECT * FROM customer_journey where journey_id = '" + journey_id + "'  And customer_id = '" + customer_id + "' ";
    db.query(customerjourneyquery, true)
    .then(function (data) {
    console.log('data:'+data);
      if(data.length > 0){
      console.log('dataid:'+data[0].id);
      console.log('dataid:'+data[0].mcstatus);
      if(data[0].mcstatus != true){
      console.log('inside mcstatus condition');
      var updateQuery = "UPDATE customer_journey SET mcstatus = true WHERE id = '" + data[0].id + "'";
    
    db.query(updateQuery, true)
    .then(function (data) {
     return res.json(data);
    })
      .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
      }
     else{
          return res.json(data);
      }
    }
    else{
      console.log('else condition');
      var insertQuery =
    "INSERT INTO customer_journey (customer_id, journey_id,mcstatus) VALUES ('" +
    customer_id +
    "','" +
    journey_id +
    "',true)";
    
    db.query(insertQuery, true)
    .then(function (data) {
     return res.json(data);
    
    })
    .catch(function (err) {
    console.log("ERROR:", err); // print the error;
     return res.status(400).json({ success: false, error: err });
    })
    }
      
    })
    .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
    })
    .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
    })
    .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
 .finally(function () {
      pgp.end(); // for immediate app exit, closing the connection pool.
    }); */
});
app.post("/api/updatecustomercreativestatus", function (req, res) {
  //res.render("index.ejs"); // load the index.ejs file
  const { Template_key, customer_key } = req.body;
  // var customer_key  = 'welath001';
  //var journey_key ='ixn-created-Meeting-Executed-api';
  var customer_id;
  var creative_id;
  var customer_journey_id;
  console.log("customer_key:" + customer_key);
  console.log("journey_key:" + Template_key);
  var customerquery =
    "SELECT id,name,salesforceid,customer_key FROM customer where customer_key = '" +
    customer_key +
    "'";
  db.query(customerquery, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    customer_id = result.rows[0].id;
    console.log("customerid:" + customer_id);
    var creativequery =
      "SELECT * FROM creative where templatekey = '" + Template_key + "'";
    db.query(creativequery, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      }
      creative_id = result.rows[0].id;
      console.log("creative_id:" + creative_id);
      var customercreativequery =
        "SELECT * FROM customer_creative where creativeid = '" +
        creative_id +
        "'  And customerid = '" +
        customer_id +
        "' ";
      db.query(customercreativequery, (err, result) => {
        if (err) {
          console.log(err);
          res.status(400).send(err);
        }
        console.log("result:" + result);
        if (result.rows.length > 0) {
          console.log("dataid:" + result.rows[0].id);
          console.log("dataid:" + result.rows[0].mcstatus);
          if (result.rows[0].mcstatus != true) {
            console.log("inside mcstatus condition");
            var updateQuery =
              "UPDATE customer_creative SET mcstatus = true WHERE id = '" +
              result.rows[0].id +
              "'";
            db.query(updateQuery, (err, result) => {
              if (err) {
                console.log(err);
                res.status(400).send(err);
              }
              res.status(200).send(result.rows);
            });
          } else {
            res.status(400).send("already Exists");
          }
        } else {
          console.log("else condition");
          var insertQuery =
            "INSERT INTO customer_creative (customerid, creativeid,mcstatus) VALUES ('" +
            customer_id +
            "','" +
            creative_id +
            "',true)";
          db.query(insertQuery, (err, result) => {
            if (err) {
              console.log(err);
              res.status(400).send(err);
            }
            res.status(200).send(result.rows);
          });
        }
      });
    });
  });

  /*  var customerquery="SELECT id,name,salesforceid,customer_key FROM customer where customer_key = '" + customer_key + "'"
  db.query(customerquery, true)
    .then(function (data) {
    customer_id=data[0].id;
    console.log('customerid:'+customer_id);
    var creativequery = "SELECT * FROM creative where templatekey = '" + Template_key + "'";
    db.query(creativequery, true)
    .then(function (data) {
    creative_id=data[0].id;
    console.log('creative_id:'+creative_id);
     // return res.json(data);
    var customerjourneyquery= "SELECT * FROM customer_creative where creativeid = '" + creative_id + "'  And customerid = '" + customer_id + "' ";
    db.query(customerjourneyquery, true)
    .then(function (data) {
    console.log('data:'+data);
      if(data.length > 0){
      console.log('dataid:'+data[0].id);
      console.log('dataid:'+data[0].mcstatus);
      if(data[0].mcstatus != true){
      console.log('inside mcstatus condition');
      var updateQuery = "UPDATE customer_creative SET mcstatus = true WHERE id = '" + data[0].id + "'";
    
    db.query(updateQuery, true)
    .then(function (data) {
     return res.json(data);
    })
      .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
      }
     else{
          return res.json(data);
      }
    }
    else{
      console.log('else condition');
      var insertQuery =
    "INSERT INTO customer_creative (customerid, creativeid,mcstatus) VALUES ('" +
    customer_id +
    "','" +
    creative_id +
    "',true)";
    
    db.query(insertQuery, true)
    .then(function (data) {
     return res.json(data);
    
    })
    .catch(function (err) {
    console.log("ERROR:", err); // print the error;
     return res.status(400).json({ success: false, error: err });
    })
    }
      
    })
    .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
    })
    .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
    })
    .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
 .finally(function () {
      pgp.end(); // for immediate app exit, closing the connection pool.
    }); */
});

app.post("/api/getdataExtensionByKey", function (req, res) {
  const { Extension_Key } = req.body;
  console.log("Extension_Key:" + Extension_Key);
  const results = [];

  var query =
    "SELECT dataextension.*,datafields.* FROM dataextensionfields \
INNER JOIN dataextension ON dataextension.ID = dataextensionfields.data_extension_id \
INNER JOIN datafields  \
  ON dataextensionfields.fields_id = datafields.ID \
WHERE dataextension.extension_key= '" +
    Extension_Key +
    "' ";
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send(result.rows);
  });
});

app.post("/api/updateCustomerExtension", function (req, res) {
  const { Data_Extension_Key, Customer_Key } = req.body;
  console.log("Customer_Key:" + Customer_Key);
  console.log("Data_Extension_Key:" + Data_Extension_Key);
  var data_extension_id;
  var customer_id;
  var customerquery =
    "SELECT id,name,salesforceid,customer_key FROM customer where customer_key = '" +
    Customer_Key +
    "'";
  db.query(customerquery, (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    customer_id = result.rows[0].id;
    console.log("customerid:" + customer_id);
    var extensionquery =
      "select * from dataextension where extension_key = '" +
      Data_Extension_Key +
      "'";
    db.query(extensionquery, (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      }
      data_extension_id = result.rows[0].id;
      console.log("data_extension_id:" + data_extension_id);
      var customerextensionquery =
        "select * from customer_data_extension where dataextensionid ='" +
        data_extension_id +
        "' And customerid = '" +
        customer_id +
        "' ";
      db.query(customerextensionquery, (err, result) => {
        if (err) {
          console.log(err);
          res.status(400).send(err);
        }
        console.log("result:" + result);
        if (result.rows.length == 0) {
          var insertQuery =
            "INSERT INTO customer_data_extension (dataextensionid, customerid) VALUES ('" +
            data_extension_id +
            "','" +
            customer_id +
            "')";
          db.query(insertQuery, (err, result) => {
            if (err) {
              console.log(err);
              res.status(400).send(err);
            }
            res.status(200).send(result.rows);
          });
        } else {
          console.log("else condition");
          res.status(400).send("already Exists");
        }
      });
    });
  });

  /*var customerquery = "SELECT * FROM customer where customer_key = '" + Customer_Key + "'";
  db.query(customerquery, true)
    .then(function (data) {
    customer_id=data[0].id;
    console.log('customer_id:'+customer_id);
   var extensionquery = "select * from dataextension where extension_key = '" + Data_Extension_Key + "'";
   db.query(extensionquery, true)
    .then(function (data) {
    data_extension_id=data[0].id;
     console.log('data_extension_id:'+data_extension_id);
   var customerextensionquery= "select * from customer_data_extension where dataextensionid ='" + data_extension_id +"' And customerid = '" + customer_id+ "' ";
    db.query(customerextensionquery, true)
    .then(function (data) {
    console.log('data:'+data);
      if(data.length == 0){
    var insertQuery =
    "INSERT INTO customer_data_extension (dataextensionid, customerid) VALUES ('" +
    data_extension_id +
    "','" +
    customer_id +
    "')";
    
    db.query(insertQuery, true)
    .then(function (data) {
     return res.json(data);
    })
      .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
    }
      else{
        return res.json(data);
      }
    })
    .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
    })
    .catch(function (err) {
      console.log("ERROR:", err); // print the error;
      return res.status(400).json({ success: false, error: err });
    })
    })
    
     
 .finally(function () {
      pgp.end(); // for immediate app exit, closing the connection pool.
    }); */
});
module.exports = app;