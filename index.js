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
	console.log(`running at ${process.env.HOSTNAME}:${process.env.PORT}`)
})

function retrieveFoundWords() {
	try {
		result = fetch(
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
				new Response(stream, {
					headers: { 'Content-Type': 'text/html' },
				}).text()
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
		return result
	} catch (error) {
		console.log(error)
	}
}

function retrieveHints() {
	// return JSDOM.fromURL(
	// 	'https://www.nytimes.com/spotlight/spelling-bee-forum'
	// ).then((dom) => {
	// 	let { document } = dom.window
	// 	const listOfLinks = Array.from(document.querySelectorAll('ol a'))
	// 	const todaysLink = listOfLinks[0]
	// 	const linkText = todaysLink.href
	console.log(getCurrentHintUrl())
	return JSDOM.fromURL(getCurrentHintUrl()).then((dom) => {
		return JSON.stringify({
			cellTextArray: getGridData(dom),
			twoLetterData: getTwoLetterData(dom),
		})
	})
}

// TODO: fix to use gmt
function getCurrentHintUrl() {
	const MINUTES_IN_HOUR = 60
	const SECONDS_IN_MINUTE = 60
	const MILLISECONDS_IN_SECOND = 1000
	const MILLISECONDS_IN_TWO_HOURS =
		2 * MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND
	const dateToday = new Date(Date.now() - MILLISECONDS_IN_TWO_HOURS)
	const year = dateToday.getFullYear()
	const { month, date } = formatMonthAndDate({
		month: dateToday.getMonth(),
		date: dateToday.getDate(),
	})
	const hintUrl = `https://www.nytimes.com/${year}/${month}/${date}/crosswords/spelling-bee-forum.html`
	console.log(hintUrl)
	return hintUrl
}

function formatMonthAndDate(options) {
	let { month, date } = options
	month += 1
	month = month < 10 ? '0' + month : month
	date = date < 10 ? '0' + date : date
	return { month, date }
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
