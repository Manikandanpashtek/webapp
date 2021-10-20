const { Pool, Client } = require('pg')
//const connectionString = 'postgres://xikaepnupjihny:ed8939f2a3555e38e3ff018e0adb5885463936afffd70c501f6b1d5fcefdf7a3@ec2-3-218-75-21.compute-1.amazonaws.com:5432/d8muah1afp73t'
console.log('process.env.DATABASE_URL:'+process.env.DATABASE_URL);
const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
      }
})

module.exports = pool;
