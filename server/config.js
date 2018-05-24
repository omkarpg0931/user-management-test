var env = process.env.NODE_ENV || 'development';

var config = {
  port: 3000,
  db: 'mongodb://localhost/kodework',
  secret: "my_secret",
  email: "omk@omkar.com",
  password: "password"
};

if (env === "production") {
  config.db = process.env.DB_LINK;
  config.port = process.env.PORT;
  config.secret = process.env.secret;
  config.email = process.env.email;
  config.password = process.env.password;
}

module.exports = config;