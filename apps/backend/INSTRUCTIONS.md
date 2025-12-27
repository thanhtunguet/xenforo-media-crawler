Write a crawler service and crawler controller that provide APIs:
The needed APIs:
- Login using existing JSON
- Login with credentials and save cookie to JSON file (The login form can return any 30x redirect. Handle all cases)
- Crawl a thread (thread id argument) with the following steps:
  + Crawl the first page of thread
  + In the first page's DOM, read the element with selector class="pageNavSimple-el pageNavSimple-el--last", that would have outerHTML like this: <a href="/threads/1577/page-223" class="pageNavSimple-el pageNavSimple-el--last" data-xf-init="tooltip" title="Cuối">
			<i aria-hidden="true"></i> <span class="u-srOnly">Cuối</span>
		</a>
    In this example, the last page is 223
  + Loop through thread's pages, from the first to the last, find all images / videos inside message content div with class="message-content js-messageContent" (Note: ignore data URIs, links that contains "assets"). If the media is image, use the src prop, if the media is video, use the child source's src prop
  + Also parse external links inside message-content, because users can post images/videos by using external links
  + This command should support download option with target directory specified, default to "downloads/"
  + because message can be quoted by other users, the media in the whole thread could be duplicated, if downloading, download only distinct media

Important Notes:
- Use axios for all HTTP requests, with cookie jar supported, cookie saved to "cookies.json" with the following format:

```json
{
"domain": "xamvn.autos",
"expirationDate": 1776076576.589799,
"hostOnly": true,
"httpOnly": true,
"name": "xf_user",
"path": "/",
"sameSite": "unspecified",
"secure": true,
"session": false,
"storeId": "0",
"value": "182669%2CR6p2SVSRmQ5Y4o4Cbj-5reafTsbSpoYl6f6rcNKh",
"id": 5
}
```
