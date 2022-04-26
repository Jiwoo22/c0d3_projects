const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const app = express();

const ipMapping = {};
let stats = {};

fs.readFile("./stats,db", (err, db) => {
  if (err) {
    return;
  }
  try {
    stats = JSON.parse(db);
  } catch (e) {}
});

const updateStates = (address) => {
  const cityInfo = stats[address.cityStr] || {};
  const llKey = [JSON.stringify(address.ll)];
  cityInfo[llKey] = (cityInfo[llKey] || 0) + 1;

  stats[address.cityStr] = cityInfo;
  fs.writeFile("./stats.db", JSON.stringify(stats), () => {});
};

app.use(async (req, res, next) => {
  const ipAddress =
    req.header("x-forwarded-for") || req.connection.remoteAddress;
  let address = ipMapping[ipAddress];
  if (!address) {
    console.log("cache missing, sending request");
    address = await fetch(
      `http://js5.c0d3.com/location/api/ip/${ipAddress}`
    ).then((r) => r.json());
    ipMapping[ipAddress] = address;
    updateStates(address);
    req.address = address;
    return next();
  }
  console.log("your address is", address);
  updateStates(address);
  req.address = address;
  return next();
});

const getHTML = (cityStr, latlng, groupCityStr) => {
  const locationStr = Object.keys(stats).reduce((acc, cityStr) => {
    const locationMap = stats[cityStr];
    const totalCount = Object.values(locationMap).reduce((acc, v) => acc + v);
    return (
      acc +
      `
    <a href="/location/city/${cityStr}"> 
    <h2>${cityStr} - ${totalCount}</h2>
    </a>
    `
    );
  }, "");

  const localMap = stats[groupCityStr] || {};
  const locations = Object.keys(localMap).reduce((acc, latlngStr) => {
    const ll = JSON.parse(latlngStr);
    return (
      acc +
      `
      new google.maps.Marker({
        position: {lat: ${ll[0]}, lng: ${ll[1]}},
        map: map,
        title: '${localMap[latlngStr]} Hits'
      })
      `
    );
  }, "");

  const script = `
    function myMap() {
      var mapProp= {
        center:new google.maps.LatLng(${latlng[0]}, ${latlng[1]}),
          zoom:11,
      };
      var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);
      ${locations}
    }
  `;
  return `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/andybrewer/mvp/mvp.css" />
    <h1>You are visiting from ${cityStr}</h1>
    <div id="googleMap" style="width: 100%; height: 500px;"></div>
    <h1>The cities our visitors come from</h1>
    <div style="max-height: 300px; overflow: auto;">
      ${locationStr}
    </div>
    <hr>
    <script>${script}</script>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB29pGpCzE_JGIEMLu1SGIqwoIbc0sHFHo&amp;callback=myMap"></script>
  `;
};

app.get("/", (req, res) => {
  res.send("hello");
});

app.get("/visitors", async (req, res) => {
  console.log("your address is", req.address);
  const htmlStr = getHTML(
    req.address.cityStr,
    req.address.ll,
    req.address.cityStr
  );
  res.send(htmlStr);
});

app.get("/api/visitors", (req, res) => {
  res.json(stats);
});

app.get("/location/city/:cityStr", async (req, res) => {
  const cityStr = req.params.cityStr;
  const locationMap = stats[cityStr];
  const firstLL = JSON.parse(Object.keys(locationMap)[0]);
  const htmlStr = getHTML(req.address.cityStr, firstLL, cityStr);
  res.send(htmlStr);
});

app.listen(8000);
