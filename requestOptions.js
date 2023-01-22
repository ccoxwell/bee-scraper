require('dotenv').config()

const dom_request_options = {
	credentials: 'include',
	headers: {
		'User-Agent':
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0',
		Accept:
			'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.5',
		'Upgrade-Insecure-Requests': '1',
		'Sec-Fetch-Dest': 'document',
		'Sec-Fetch-Mode': 'navigate',
		'Sec-Fetch-Site': 'same-origin',
		'Sec-Fetch-User': '?1',
		Pragma: 'no-cache',
		'Cache-Control': 'no-cache',
	},
	referrer: 'https://www.nytimes.com/crosswords',
	method: 'GET',
	mode: 'cors',
}

const found_req_options = {
	credentials: 'omit',
	headers: {
		'User-Agent':
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0',
		Accept: '*/*',
		'Accept-Language': 'en-US,en;q=0.5',
		'nyt-s': process.env.NYTS_COOKIE,
		'Content-type': 'application/x-www-form-urlencoded',
		'Sec-Fetch-Dest': 'empty',
		'Sec-Fetch-Mode': 'cors',
		'Sec-Fetch-Site': 'cross-site',
		Pragma: 'no-cache',
		'Cache-Control': 'no-cache',
	},
	referrer: 'https://www.nytimes.com/',
	method: 'GET',
	mode: 'cors',
}

module.exports = { dom_request_options, found_req_options }
