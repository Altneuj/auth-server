BASEURL = 'http://localhost:3001'

let state = {
	apiKey: '',
	login: {
		username: '',
		password: ''
	},
	stores: [],
	token: ''
}

function getData(url, apiKey) {
	return fetch(url, {
		method: 'GET',
	  headers: {
	    "x-authentication": apiKey
	  }
	})
	.then(response => {
		return response.ok ? response.json() : response.statusText
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
}

function getStoreIssues(user, accessToken) {
	let url = `${BASEURL}/api/stores/${1}/issues?accessToken=${accessToken}`
	return fetch(url, {
		method: 'GET',
		headers: {
	    "x-authentication": state.apiKey,
			'content-type': 'application/json'
	  }
	})
	.then(response => response.json())
	.then(data => console.log(data))
	.catch(err => console.log(err))
}








// Handle API Key Submission
$('#submitApiKey').on('click', () => {
	state.apiKey = $('#apiKey').val()
	getData(`${BASEURL}/api/stores`, state.apiKey)
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
		.then(data => {
		 	state.token = data
			renderToken()
			getStoreIssues(state.login, state.token)
		})
		.catch(err => err)
})

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

function renderToken() {
		let $container = $('#loginResponse')
		let error = `<p style='color: red'>${state.token}</p>`
		let success = `<p>${state.token}</p>`
		state.token === 'Invalid username or password' ? $container.html(error) : $container.html(success)
}
