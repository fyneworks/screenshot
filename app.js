const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const puppeteer = require('puppeteer');

const generate_png = async (url) => {
  console.log('gereratepng', {url});
  const browser = await puppeteer.launch({devtools:false});
  const page = await browser.newPage();

  // most common screen sizes
  // 1366×768 – 29.25%
  // 1920×1080 – 17.34%
  // 1440×900 – 7.32%
  // 1600×900 – 5.72%
  // 1280×800 – 5.27%
  // 1280×1024 – 4.51%

  const viewport = { width: 1366, height: 768 };
  await page.goto(url, {waitUntil: ["load", "networkidle2"]});
  await page.setViewport(viewport);
  const buffer = await page.screenshot(viewport);
  await browser.close();
  console.log('gereratepng result', {buffer});
  return buffer;
};

const handle_request = (req, res) => {

  return new Promise((resolve, reject)=>{

      const opts = Object.assign( {}, req.query || {}, req.body || {});
      const url = opts.url;
      const filename = opts.filename || "screenshot_"+ ((new Date()).toISOString()) +".png";

      console.log('incoming request', { url: url,  body: req.body,  query: req.query });

      if(!!url){

        console.log('generate png', {url:url});

        generate_png(url)
          .then( buffer=>{

            res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
            res.setHeader('Content-type', 'image/png');

            console.log('generate png error', {buffer});
            res.end(buffer);
          })

          .catch( error=>{
            console.error('generate png error', {error});
            res.send({
              "status": "e",
              "error": error
            });

          })
        ;
        return;
      }


      res.send({
        status: "e",
        error: "no url to screenshot",
        url: req.url,
        path: req.path,
        body: req.body
      })

  });
};


// remove powered-by nonsense - https://stackoverflow.com/questions/10717685/how-to-remove-x-powered-by-in-expressjs
app.disable('x-powered-by'); app.use(function (req, res, next){ res.removeHeader("X-Powered-By"); next(); });

// parse input
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// accept post and get requests
app.get('/*', handle_request);
app.post('/*', handle_request);




// -- run app
// google cloud integration
const PORT = process.env.PORT || 3000;
if(!process.env.GOOGLE_CLOUD_PROJECT)
{
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
}
else
{
  app.listen(process.env.PORT || 8080, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
}
module.exports = app;
