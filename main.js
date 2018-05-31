BASEURL = 'http://localhost:3001'

let state = {
	apiKey: '',
	login: {
		username: '',
		password: ''
	},
	stores: [],
	issues: [],
	token: ''
}

// Handle API Key Submission
$('#submitApiKey').on('click', () => {
	state.apiKey = $('#apiKey').val()
	setStores(`${BASEURL}/api/stores`, state.apiKey)
		.then(data => {
			state.stores = data
			renderStores(state)
		})
		.catch(err => err)
	$('#apiKey').val('')
})

// Handle User Login Submission
$('#submitLoginInfo').on('click', () => {
	state.login.username = $('#username').val()
	state.login.password = $('#password').val()
	userLogin(`${BASEURL}/api/login`, state.login, state.apiKey)
})

// Handle User Login Submission
$('#storeIssues').on('click', '.buttons', e => {

	let container = $(e.target).closest('div')
	let inputs = container.find('input')
	let storeId = container.find('h3')[0].id
	console.log(storeId);
	let issues = []
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].checked ? issues.push(inputs[i].value) : null
	}

	updateStoreIssues(state.token, storeId, issues)
})



function setStores(url, apiKey) {
	return fetch(url, {
		method: 'GET',
	  headers: {
	    "x-authentication": apiKey
	  }
	})
	.then(response => {
		return response.ok ? state.stores = response.json() : state.stores = response.statusText
	})
}


function userLogin(url, data, apiKey) {
	return fetch(url, {
		method: 'POST',
		body: JSON.stringify(data),
	  headers: {
	    "x-authentication": apiKey,
			'content-type': 'application/json'
	  }
	})
	.then(response => {
		return response.ok ? response.json() : response.statusText
	})
	.then(data => {
		state.token = data
		renderToken()
		state.stores.forEach(s => {
			return getStoreIssues(state.token, s.id)
		})

	})
	.catch(err => err)
}

function getStoreIssues(accessToken, storeId) {
	let url = `${BASEURL}/api/stores/${storeId}/issues?accessToken=${accessToken}`
	return fetch(url, {
		method: 'GET',
		headers: {
	    "x-authentication": state.apiKey,
			'content-type': 'application/json'
	  }
	})
	.then(response => {
		return response.ok ? response.json() : response.statusText
	})
	.then(data => {
		state.issues.push(data)
		renderIssues(state)
		// render data
	})
	.catch(err => console.log(err))
}

function updateStoreIssues(accessToken, storeId, issues) {
	let url = `${BASEURL}/api/stores/${storeId}/issues?accessToken=${accessToken}`
	return fetch(url, {
		method: 'POST',
		body: JSON.stringify(issues),
		headers: {
	    "x-authentication": state.apiKey,
			'content-type': 'application/json'
	  }
	})
	.then(response => {
		return response.ok ? response.json() : response.statusText
	})
	.then(data => {
		console.log(data);
		// state.issues.push(data)
		// renderIssues(state)
		// // render data
	})
	.catch(err => console.log(err))
}




function renderStores(state) {
	let $container = $('#apiKeyResponse')
	if (typeof state.stores === 'string') {
		$container.html(state.stores)
	} else {
		let stores = state.stores.map(s => {
			return `
			<ul>
				<li>id: ${s.id}</li>
				<li>name: ${s.name}</li>
				<li>open: ${s.open}</li>
				<li>issues: ${s.issues}</li>
			</ul>
			`
		})
		$container.html(stores)
	}
}

function renderIssues(state) {
	if(state.issues.length === 4) {


		function storeIssues(i) {
			console.log(state.issues[i]);

			let issuesHTML = []
			if (state.issues[i].length > 10) { issuesHTML.push(state.issues[i]) }
				else {
					issuesHTML.push(`
						<label>leaky roof</label>
						<input type="checkbox" id="" value="leaky roof" ${state.issues[i] && state.issues[i].includes('leaky roof') ? 'checked' : null}> <br>
						<label>no inventory</label>
						<input type="checkbox" id="" value="no inventory" ${state.issues[i] && state.issues[i].includes('no inventory') ? 'checked' : null}> <br>
						<label>broken furniture</label>
						<input type="checkbox" id="" value="broken furniture" ${state.issues[i] && state.issues[i].includes('broken furniture') ? 'checked' : null}> <br>
						<label>fire damage</label>
						<input type="checkbox" id="" value="fire damage" ${state.issues[i] && state.issues[i].includes('fire damage') ? 'checked' : null}> <br>
						<label>no security cameras</label>
						<input type="checkbox" id="" value="no security cameras" ${state.issues[i] && state.issues[i].includes('no security cameras') ? 'checked' : null}> <br>
					`)
				}
			return issuesHTML
		}


		function storeList() {
			let storesHTML = []
			for (var i = 0; i < state.stores.length; i++) {
				let name = state.stores[i].name
				let id = state.stores[i].id
				storesHTML.push(`
					<div>
						<h3 id="${id}">${name}</h3>
						${storeIssues(i)}
						<button type="submit" id=${name} class='buttons'>Save</button>
					</div>

					<span id='saveError' style='color: red'></span>
				`)
			}
			return storesHTML
		}

		let $container = $('#storeIssues')
		$container.html(storeList())

	}
}

function renderToken() {
		let $container = $('#loginResponse')
		let error = `<p style='color: red'>${state.token}</p>`
		let success = `<p>${state.token}</p>`
		state.token === 'Invalid username or password' ? $container.html(error) : $container.html(success)
}
