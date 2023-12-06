const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');
const compression = require('compression'); 

require('dotenv').config();

const middlewares = require('./middlewares');
const api = require('./api');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(compression()); // Enable compression
app.use(express.json());

// In-memory cache
const cache = {};

app.get('/', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username parameter is missing.' });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0',
      "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      "Accept-Language": 'en-US,en;q=0.5',
      "Connection": 'keep-alive',
    }

    const url = `https://www.artstation.com/users/${username}/projects.json`;

    // Check cache
    if (cache[url]) {
      return res.json(cache[url]);
    }

    const response = await axios.get(url, { headers });

    if (response.status !== 200) {
      throw new Error(`Failed to download JSON. Status code: ${response.status}`);
    }

    const data = response.data.data;
    const projectRequests = data.map(i => {
      const newUrl = `https://www.artstation.com/projects/${i.permalink.split("/").pop()}.json`;
      return axios.get(newUrl, { headers });
    });

    const projectResponses = await axios.all(projectRequests);

    const ModifiedData = projectResponses.map((newResponse, index) => {
      if (newResponse.status !== 200) {
        throw new Error(`Failed to download 2nd JSON. Status code: ${newResponse.status}`);
      }

      const i = data[index];
      const singleArtworkUrls = newResponse.data.assets.slice(0, 3).map(j => j.image_url.split("?")[0]);
      
      return {
        title: i.title,
        description: i.description,
        created_at: i.created_at,
        likes_count: i.likes_count,
        adult_content: i.adult_content,
        permalink: i.permalink,
        artwork_urls: singleArtworkUrls,
      };
    });

    // Store in cache
    cache[url] = ModifiedData;

    return res.json({
      data: ModifiedData,
      status : 200
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Internal Server Error',
      status : 500
    });
  }
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
