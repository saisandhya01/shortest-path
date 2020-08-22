var express = require("express");
var request = require("request");
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
//var client_id = "client_id";
//var client_secret = "client_secret";
var redirect_uri = "http://localhost:8888/callback";
let access_token = "";
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = "spotify_auth_state";

var app = express();

app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = "user-read-private user-read-email";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});
app.get("/callback", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          new Buffer(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url:
            "https://api.spotify.com/v1/artists/06HL4z0CvFAxyc27GXpf02/related-artists",
          headers: { Authorization: "Bearer " + access_token },
          json: true,
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          if (error) throw error;
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect(
          "/#" +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
            })
        );
      } else {
        res.redirect(
          "/#" +
            querystring.stringify({
              error: "invalid_token",
            })
        );
      }
    });
  }
});

app.get("/refresh_token", function (req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        access_token: access_token,
      });
    }
  });
});

//program starts from here
app.get("/related-artist", (req, res) => {
  res.render("search");
});
class idDist {
  constructor(id, dist) {
    (this.id = id), (this.dist = dist);
  }
}
let hashMap = new Map();
function findShortestPath(id1, id2) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        let access_token = "";
        let queue = [];
        let objectid1 = new idDist(id1, 0);
        queue.push(objectid1);
        hashMap.set(id1, 1);
        while (queue.length > 0) {
          let t = queue[0];
          queue.shift();
          if (t.id === id2) {
            return resolve(t.dist);
          }
          const response = await fetch(
            `https://api.spotify.com/v1/artists/${t.id}/related-artists`,
            {
              method: "GET",
              headers: {
                Authorization: "Bearer " + access_token,
                //Accept: "application/vnd.citationstyles.csl+json",
              },
            }
          );
          const json = await response.json();
          let result = json.artists;
          for (let i = 0; i < result.length; i++) {
            if (!hashMap.has(result[i].id)) {
              hashMap.set(result[i].id, 0);
            }
            if (hashMap.get(result[i].id) === 0) {
              hashMap.set(result[i].id, 1);
              let object = new idDist(result[i].id, t.dist + 1);
              queue.push(object);
            }
          }
        }
      } catch (error) {
        return reject(error);
      }
    })();
  });
}
async function call(id1, id2) {
  try {
    const result = await findShortestPath(id1, id2);
    console.log("Shortest path:", result);
  } catch (error) {
    console.log(error);
  }
}
//call("1uNFoZAHBGtllmzznpCI3s", "6KImCVD70vtIoJWnq6nGn3");
function findId(name) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        let access_token = "";
        const response = await fetch(
          `https://api.spotify.com/v1/search/?q=${name}&type=artist`,
          {
            method: "GET",
            headers: {
              Authorization: "Bearer " + access_token,
              //Accept: "application/vnd.citationstyles.csl+json",
            },
          }
        );
        const json = await response.json();
        resolve(json.artists.items[0].id);
      } catch (error) {
        reject(error);
      }
    })();
  });
}

/*async function call1(name) {
  try {
    const result = await findId(name);
    console.log(result);
  } catch (error) {
    console.log(error);
  }
}
call1("taylor"); */
app.post("/names", async (req, res) => {
  try {
    const details = req.body;
    const id1 = await findId(details.name1);
    console.log("Artist 1 id:", id1);
    const id2 = await findId(details.name2);
    console.log("Artist 2 id:", id2);
    call(id1, id2);
  } catch (error) {
    console.log(error);
  }
});
console.log("Listening on 8888");
app.listen(8888);
