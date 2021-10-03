# wp-archive-scrape

Wow! Another boringly named repo!

The gist of this script is to download Wordpress images from `web.archive.org` while maintaining folder structure. It does a wildcard search for all items in the default Wordpress uploads directory, then downloads all items containing `image` in the MIME.

## Usage

`node index.js -d https://example.com -o outputFolder`

| Argument                 | Description                                                   | Default    |
|--------------------------|---------------------------------------------------------------|------------|
| `-d https://example.com` | Domain to scrape. Has `/wp-content/uploads` appended to it.   | N/A        |
| `-o outputFolder`        | Where all images are saved. Is prepended with `./`. Optional. | `wp-uploads` |
