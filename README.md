[![Build Status](https://travis-ci.org/toolness/lotl-site-prototype.svg)](https://travis-ci.org/toolness/lotl-site-prototype)

This is a potential replacement for the [Life of The Law][lotl] website.

## Quick Start

```
git clone https://github.com/toolness/lotl-site-prototype.git
cd lotl-site-prototype
npm install
npm test
DEBUG= node app.js
```

## Architecture

The site is built as a single-page web application. The primary
reason for this is that we wanted users to be able to listen to a
podcast episode continuously while exploring the website, which
isn't possible with a traditional site that requires a full page
refresh on navigation (at least, not without a pop-out player).

The site has a fairly simple back-end that largely delegates requests
to a WordPress backend via the [WordPress JSON API][wpapi].

## Environment Variables

**Note:** When an environment variable is described as representing a
boolean value, if the variable exists with *any* value (even the empty
string), the boolean is true; otherwise, it's false.

* `DEBUG` represents a boolean value. Setting this to true makes the server
  rebuild various local files when they change, instead of aggressively
  caching them, among other things.

* `NEWRELIC` represents a boolean value. Setting it to true enables
  [New Relic][] Application Monitoring (APM).

* `NEWRELIC_APP_NAME` is the app name for New Relic APM.

* `NEWRELIC_LICENSE_KEY` is the license key for New Relic APM.

<!-- Links -->

  [lotl]: http://lifeofthelaw.org
  [wpapi]: https://wordpress.org/plugins/json-api/
  [New Relic]: http://newrelic.com/
