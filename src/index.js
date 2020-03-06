import 'normalize.css'
import './index.scss'
import controller from './controller'

const d3 = require('d3')

controller.setup()

var repository = "https://github.com/MatteoSalvino/VA-Roman-Empire"
d3.select("#githubBtn")
    .on("click", () => window.open(repository))