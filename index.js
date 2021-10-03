const fs = require('fs')
const axios = require('axios')
const get = require('async-get-file')
const parseArgs = require('minimist')

// https://stackoverflow.com/a/3561711
const regexEscape = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

// I wanna use await, so let's just put this in an anon function
(async () => {
  const arguments = parseArgs(process.argv.slice(2))

  // Domain must be provided
  if (!arguments.d) {
    console.log('Must provide domain to be scraped')
    console.log('Example: node index.js -d https://example.com')
  }

  // Build the basic stuff that we need from the args
  const searchUrl = `${arguments.d}/wp-content/uploads/*`
  const outputFolder = arguments.o ? `./${arguments.o}` : './wp-uploads'
  const apiUrl = `https://web.archive.org/cdx/search/cdx?url=${searchUrl}&output=json&limit=1000`

  const response = await axios.get(apiUrl)
  const apiData = response.data

  let savedFiles = []
  let index = 1

  console.log(`${Math.max(0, apiData.length - 1)} items found for ${searchUrl}`)
  console.log('')

  for (const item of apiData) {
    // First item of apiData is a key, don't need it
    if (item[0] === 'urlkey') {
      continue
    }

    // Since we only want images, let's skip anything that doesn't have an image MIME
    if (!item[3].includes('image')) {
      continue
    }

    // We need to make the output folder if it doesn't exist
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder)
    }

    const itemArchiveDate = item[1]
    const itemUrl = item[2]

    // From the URL we can get some stuff like folder structure, filename etc
    // Probably the easiest way to get this stuff is Regex, so let's build a query
    const regexUrl = searchUrl.substring(0, searchUrl.length - 1)
    const regex = RegExp(`(?:${regexEscape(regexUrl)}(\\d{4})\/(\\d{2})\/(.*))`, 'g')

    const matches = [...itemUrl.matchAll(regex)][0]
    
    const itemYear = matches[1]
    const itemMonth = matches[2]
    const itemName = matches[3]

    const itemRelativePath = `/${itemYear}/${itemMonth}/${itemName}`

    // Let's check whether we've already saved the file, no point saving it twice
    if (savedFiles.includes(itemRelativePath)) {
      continue
    }

    // Ok, so it's not been saved and seems to be valid so far, so let's build the URL to download it
    // Before that though, we've got to make sure the folders exist or Node will throw a fit
    if (!fs.existsSync(`${outputFolder}/${itemYear}/${itemMonth}`)) {
      fs.mkdirSync(`${outputFolder}/${itemYear}/${itemMonth}`, { recursive: true })
    }

    // Now we can start downloading
    const itemArchiveUrl = `https://web.archive.org/web/${itemArchiveDate}im_/${itemUrl}`

    console.log(`Downloading item ${index} of ${apiData.length - 1}`)
    console.log(`Path: ${itemRelativePath}`)
    console.log('')

    // There's probably a way to do this with Axios and fs, but fucked if I can be bothered figuring it out
    await get(itemArchiveUrl, {
      directory: `${outputFolder}/${itemYear}/${itemMonth}/`,
      filename: itemName
    })

    console.log(`Item saved to ${outputFolder}${itemRelativePath}`)
    console.log('')
    console.log('---')
    console.log('')

    // Now we can add the file to the array so it's not written twice
    savedFiles.push(itemRelativePath)
    index++
  }

  console.log('Done')
})()