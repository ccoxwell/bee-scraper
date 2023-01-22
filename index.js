const jsdom = require('jsdom')
const http = require('http')
const { dom_request_options, found_req_options } = require('./requestOptions')

const { JSDOM } = jsdom

const HOSTNAME = process.HOSTNAME
const PORT = process.PORT

const server = http.createServer((req, res) => {
	res.statusCode = 200
	res.setHeader('Content-Type', 'application/json')
	if (req.url === '/hints') {
		try {
			retrieveHints().then(
				(response) => {
					return res.end(response)
				},
				(err) => console.log(err)
			)
		} catch (err) {
			console.log(err)
		}
	} else if (req.url === '/current-words') {
		try {
			retrieveFoundWords().then(
				(data) => res.end(data),
				(err) => console.log(err)
			)
		} catch (err) {
			console.log(err)
		}
	}
})

server.listen({ host: process.env.HOSTNAME, port: process.env.PORT }, () => {
	console.log('Server running')
})

function retrieveFoundWords() {
	return fetch(
		'https://www.nytimes.com/puzzles/spelling-bee',
		dom_request_options
	)
		.then((response) => response.body)
		.then((rb) => {
			const reader = rb.getReader()
			return new ReadableStream({
				start(controller) {
					function push() {
						reader.read().then(({ done, value }) => {
							if (done) {
								controller.close()
								return
							}
							controller.enqueue(value)
							push()
						})
					}
					push()
				},
			})
		})
		.then((stream) =>
			new Response(stream, { headers: { 'Content-Type': 'text/html' } }).text()
		)
		.then((result) => {
			const dom = new JSDOM(result, { runScripts: 'dangerously' })
			const { window } = dom
			const { id } = window.gameData.today
			const REQ_URL = `https://edge.games.nyti.nyt.net/svc/spelling-bee/v1/game/${id}.json`

			return fetch(REQ_URL, found_req_options)
				.then((res) => res.json())
				.then((data) => {
					return data.answers
				})
				.then((answers) => [...answers].sort())
				.then((foundWords) => JSON.stringify({ foundWords }))
		})
}

function retrieveHints() {
	return JSDOM.fromURL(
		'https://www.nytimes.com/spotlight/spelling-bee-forum'
	).then((dom) => {
		let { document } = dom.window
		const listOfLinks = Array.from(document.querySelectorAll('ol a'))
		const todaysLink = listOfLinks[0]
		const linkText = todaysLink.href
		return JSDOM.fromURL(linkText).then((dom) => {
			return JSON.stringify({
				cellTextArray: getGridData(dom),
				twoLetterData: getTwoLetterData(dom),
			})
		})
	})
}

function getTwoLetterData(dom) {
	let { document } = dom.window
	const twoLetterPara = document.querySelector(
		"p.content[style='text-transform: uppercase;']:last-child"
	)
	let spanRows = Array.from(twoLetterPara.children)
	const twoLetterData = spanRows.map((span) => span.textContent.trim())
	return twoLetterData
}

function getGridData(dom) {
	let { document } = dom.window
	const trs = Array.from(document.querySelectorAll('tr'))
	return trs.map((tr) => {
		let cells = Array.from(tr.cells)
		let cellTextArray = cells
			.map((cell) => {
				return cell.textContent
			})
			.join(',')
		return cellTextArray
	})
}
