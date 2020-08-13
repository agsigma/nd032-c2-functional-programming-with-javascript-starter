require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

// your API calls

// example API call
app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
            .then(res => res.json())
        res.send({ image })
    } catch (err) {
        console.log('error:', err);
    }
});

app.get('/rovers/:roverName', async (req, res) => {
    try {
        const name = req.params.roverName;
        const manifest = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${name}?api_key=${process.env.API_KEY}`)
            .then(res => res.json())        
            .catch(err => console.log('error:', err));        
        const photos = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${name}/photos?sol=${manifest.photo_manifest.max_sol}&api_key=${process.env.API_KEY}`)
            .then(res => res.json())        
            .catch(err => console.log('error:', err));    
        res.send( photos )
    } catch(err) {
        console.error('/rovers/:roverName', err);
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))