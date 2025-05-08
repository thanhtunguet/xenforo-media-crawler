import axios from 'axios';

describe('XenforoCrawlerService', () => {
  it('should downloaded', async () => {
    await axios.get('https://i.imgur.com/Hl09LXW.jpeg').then((response) => {
      console.log(response.headers);
    });
  });
});
