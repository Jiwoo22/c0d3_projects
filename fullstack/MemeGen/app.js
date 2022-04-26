const express = require("express");
const app = express();
const fs = require("fs");
const Jimp = require("jimp");

app.use(express.static("public"));

const imgCache = {};

const startApp = async () => {
  const [blackFont, whiteFont] = await Promise.all([
    Jimp.loadFont(Jimp.FONT_SANS_32_BLACK),
    Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
  ]);

  app.get("/memegen/api/:textinput", async (req, res) => {
    const textInput = req.params.textinput;
    const blurVal = req.query.blur || "1";
    const src = req.query.src || "https://placeimg.com/640/480/any";
    const black = req.query.black || false;

    const key = `${textInput}-${black}-${src}-${blurVal}`;
    const cachedData = imgCache[key] || {};
    let buffer = cachedData.data;

    if (!buffer) {
      const font = black ? blackFont : whiteFont;
      const image = await Jimp.read(src);
      image.blur(+blurVal);
      image.print(font, 20, 20, textInput);
      buffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      imgCache[key] = {
        savedAt: Date.now(),
        data: buffer,
      };

      if (Object.keys(imgCache) > 10) {
        clearCache();
      }
    }
    res.setHeader("Content-Type", "image/jpeg");
    return res.send(buffer);
  });

  const clearCache = () => {
    // Pursing the cache of old images
    const firstKey = Object.keys(imgCache)[0];
    delete imgCache[firstKey];
  };
};

app.get("/memegen", (req, res) => {
  res.send(`
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/andybrewer/mvp/mvp.css">
  </head>
  <body data-gr-c-s-loaded="true"><main>
  <h1>Image API</h1>
  <p>
    This page teaches you about generating Images using the 
    <a href="https://www.npmjs.com/package/jimp"> Jimp Library </a>
  </p>
  <pre>  https://localhost:8123/memegen/api/great job?blur=4
  </pre>
  <p>As you can see in the url above, you can put any text into the image</p>
  <p>Query parameters after that will specify whether you want any manipulation done to your image</p>
  <p>The only query paramters supported are sepia, greyscale, blur, and category</p>
  <p>Categories supported: arch, animals, nature, people, tech</p>
  <h2>Libraries Used</h2>
  <p>
    <a href="https://www.npmjs.com/package/jimp"> Jimp Library </a>
  </p>
  <p>
    <a href="https://placeimg.com/">Place IMG</a>
  </p>
  <h3>Sample Image Below</h3>
  <img src="https://js5.c0d3.com/imggen/api/super awesome city?category=arch" alt="">
  <img src="https://js5.c0d3.com/imggen/api/awwwww cute?category=animals" alt="">
  </main>
  </body>
  `);
});

app.listen(8123, () => {
  startApp();
});
