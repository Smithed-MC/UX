import { setupApp } from "../src/app.js";
import {test} from 'tap'
import dotenv from 'dotenv'
import { HTTPResponses, PackData, PackVersion } from "data-types";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeApp } from 'firebase/app'

dotenv.config()

initializeApp({
    databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
    apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
    authDomain: "mc-smithed.firebaseapp.com",
    projectId: "mc-smithed",
    storageBucket: "mc-smithed.appspot.com",
    messagingSenderId: "574184244682",
    appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
    measurementId: "G-40SRKC35Z0"
})
const auth = getAuth()

const user = await signInWithEmailAndPassword(auth, process.env.SMITHED_EMAIL ?? '', process.env.SMITHED_PASSWORD ?? '')



const TOKEN = await user.user.getIdToken()
const API = await setupApp()

const TEST_PACK_DATA: PackData = {
    id: "smithed_testing",
    display: {
        name: "Smithed Testing",
        description: 'test',
        hidden: true,
        icon: ''
    },
    versions: [
        {
            name: '0.0.1',
            dependencies: [],
            supports: ['1.19'],
            downloads: {
                datapack: 'https://example.com'
            }
        }
    ],
    categories: []
}

const TEST_VERSION_DATA: PackVersion = {
    name: '0.0.2',
    dependencies: [],
    downloads: {
        datapack: 'https://example.com'
    },
    supports: ['1.19']
}

const TEST_BAD_VERSION_DATA: PackVersion = {
    name: 'invalid',
    dependencies: [],
    downloads: {
        datapack: 'https://example.com'
    },
    supports: ['1.19']
}

test('GET /packs', async t => {
    const r = await API.inject({
        method: 'GET',
        path: '/packs'
    })
    t.equal(r.statusCode, 200, 'OK')
})

test('GET /packs/count', async t => {
    const r = await API.inject({
        method: 'GET',
        path: '/packs/count'
    })
    t.equal(r.statusCode, 200, 'OK')
})


test('GET /packs/invalid', async t => {
    const r = await API.inject({
        method: 'GET',
        path: '/packs/invalid'
    })
    t.equal(r.statusCode, 404, 'NOT FOUND')
})

test('GET /packs/tcc (Pack w/ friendly ID)', async t => {
    const r = await API.inject({
        method: 'GET',
        path: '/packs/tcc'
    })
    t.equal(r.statusCode, 200, 'OK')
})

test('GET /packs/ssISzemBUMUEFJWYuB1V (Pack w/o friendly ID)', async t => {
    const r = await API.inject({
        method: 'GET',
        path: '/packs/ssISzemBUMUEFJWYuB1V'
    })
    t.equal(r.statusCode, 200, 'OK')
})


test('POST /packs (w/o token)', async t => {
    const r = await API.inject({
        method: 'POST',
        path: '/packs',
        query: {
            id: 'smithed_testing'
        },
        payload: {
            data: TEST_PACK_DATA
        }
    })
    console.log(r.json())
    t.equal(r.statusCode, HTTPResponses.BAD_REQUEST, 'Bad request, no token')
})


test('POST /packs (w/ invalid token)', async t => {
    const r = await API.inject({
        method: 'POST',
        path: '/packs',
        query: {
            id: 'smithed_testing',
            token: 'invalid'
        },
        payload: {
            data: TEST_PACK_DATA
        }
    })
    t.equal(r.statusCode, HTTPResponses.UNAUTHORIZED, HTTPResponses[r.statusCode] + ', Unauthorized, invalid token')
})


test('POST /packs (w/ valid token) + invalid semver', async t => {
    TEST_PACK_DATA.versions.push(TEST_BAD_VERSION_DATA)

    const r = await API.inject({
        method: 'POST',
        path: '/packs',
        query: {
            id: 'smithed_testing',
            token: TOKEN
        },
        payload: {
            data: TEST_PACK_DATA
        }
    })
    const pass = t.equal(r.statusCode, HTTPResponses.BAD_REQUEST, HTTPResponses[r.statusCode] + ', Pack not created')
    if(!pass) {
        console.log(r.statusCode, await r.json())
    }

    TEST_PACK_DATA.versions.pop()

})


test('POST /packs (w/ valid token)', async t => {
    const r = await API.inject({
        method: 'POST',
        path: '/packs',
        query: {
            id: 'smithed_testing',
            token: TOKEN
        },
        payload: {
            data: TEST_PACK_DATA
        }
    })
    const pass = t.equal(r.statusCode, HTTPResponses.CREATED, HTTPResponses[r.statusCode] + ', Pack created')
    if(!pass) {
        console.log(r.statusCode, await r.json())
    }
})


test('PATCH /packs/smithed_testing with bad data', async t => {
    TEST_PACK_DATA.versions.push(TEST_BAD_VERSION_DATA)

    const r = await API.inject({
        method: 'PATCH',
        path: '/packs/smithed_testing',
        payload: {
            data: TEST_PACK_DATA
        },
        query: {
            token: TOKEN
        }
    })
    const pass = t.equal(r.statusCode, HTTPResponses.BAD_REQUEST, HTTPResponses[r.statusCode] + ', Pack not updated')
    if(!pass) {
        console.log(r.statusCode, await r.json())
    }
    TEST_PACK_DATA.versions.pop()
})



test('PATCH /packs/smithed_testing', async t => {
    TEST_PACK_DATA.display.name = "Something else"
    const r = await API.inject({
        method: 'PATCH',
        path: '/packs/smithed_testing',
        payload: {
            data: TEST_PACK_DATA
        },
        query: {
            token: TOKEN
        }
    })
    const pass = t.equal(r.statusCode, HTTPResponses.OK, HTTPResponses[r.statusCode] + ', Pack created')
    if(!pass) {
        console.log(r.statusCode, await r.json())
    }
})


test('POST /packs/:pack/versions (w/ invalid token)', async t => {
    const r = await API.inject({
        method: 'POST',
        path: '/packs/smithed_testing/versions',
        query: {
            token: 'invalid',
            version: TEST_VERSION_DATA.name
        },
        payload: {
            data: TEST_VERSION_DATA
        }
    })
    
    t.equal(r.statusCode, HTTPResponses.UNAUTHORIZED, 'Unauthorized, invalid token')
})


test('POST /packs/:pack/versions (w/ valid token) + bad semver', async t => {
    const r = await API.inject({
        method: 'POST',
        path: '/packs/smithed_testing/versions',
        query: {
            token: TOKEN,
            version: TEST_BAD_VERSION_DATA.name
        },
        payload: {
            data: TEST_BAD_VERSION_DATA
        }
    })
    
    t.equal(r.statusCode, HTTPResponses.BAD_REQUEST, 'Bad semver for new version')
})


test('POST /packs/:pack/versions (w/ valid token)', async t => {
    const r = await API.inject({
        method: 'POST',
        path: '/packs/smithed_testing/versions',
        query: {
            token: TOKEN,
            version: TEST_VERSION_DATA.name
        },
        payload: {
            data: TEST_VERSION_DATA
        }
    })
    
    t.equal(r.statusCode, HTTPResponses.CREATED, 'Created, new version')
})

test('DELETE /packs/:pack', async t => {
    const r = await API.inject({
        method: 'DELETE',
        path: '/packs/smithed_testing',
        query: {
            token: TOKEN
        }
    })
    t.equal(r.statusCode, HTTPResponses.OK, r.statusCode + ', Deleted pack')
})