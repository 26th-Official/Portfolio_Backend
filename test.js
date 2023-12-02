const axios = require('axios');
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0',
    "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    "Accept-Language": 'en-US,en;q=0.5',
    "Connection": 'keep-alive',
}

const url = "https://www.artstation.com/users/oxanstudio/projects.json";

axios.get(url, { headers: headers })
  .then(response => {
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Failed to download JSON. Status code: ${response.status}`);
    }
  }).then(response => response.data)
  .then(data => {
    console.log(data)
    data.slice(0, 6).forEach((i, index) => {
      const singleArtworkUrls = [];
      const allArtworkUrls = [];
      const newUrl = `https://www.artstation.com/projects/${i.permalink.split("/").pop()}.json`;

      axios.get(newUrl, { headers: headers })
        .then(newResponse => {
          if (newResponse.status === 200) {
            return newResponse.data;
          } else {
            throw new Error(`Failed to download 2nd JSON. Status code: ${newResponse.status}`);
          }
        })
        .then(newData => {
          newData.assets.slice(0, 3).forEach(j => {
            singleArtworkUrls.push(j.image_url.split("?")[0]);
          });
          allArtworkUrls.push(singleArtworkUrls);
          data[index].artwork_urls = allArtworkUrls;
          console.log(data)
        })
        .catch(error => console.error(error));
    }
    // return
    );
  })
  .catch(error => console.error(error));

